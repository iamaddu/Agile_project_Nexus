const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Session = require('../models/Session');
const User = require('../models/User');

// MY SESSIONS
router.get('/my-sessions', authMiddleware, async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [{ learner: req.user.id }, { mentor: req.user.id }]
    })
      .populate('mentor', 'name email teachingSkills trustScore')
      .populate('learner', 'name email')
      .sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// BOOK SESSION
router.post('/book', authMiddleware, async (req, res) => {
  try {
    const { mentorId, skill, tokenCost } = req.body;
    if (!mentorId || !skill || !tokenCost)
      return res.status(400).json({ message: 'mentorId, skill, and tokenCost required' });

    const learner = await User.findById(req.user.id);
    const mentor = await User.findById(mentorId);

    if (!mentor || !mentor.isMentor) return res.status(400).json({ message: 'Mentor not found' });
    if (mentor.isBanned) return res.status(400).json({ message: 'This mentor is not available' });
    if (learner._id.toString() === mentorId) return res.status(400).json({ message: 'Cannot book yourself' });
    if (learner.walletBalance < tokenCost) return res.status(400).json({ message: 'Insufficient tokens' });
    if (learner.trustScore < 30) return res.status(403).json({ message: 'Trust score too low to book sessions. Improve it by completing quizzes.' });

    // Escrow tokens
    learner.walletBalance -= tokenCost;
    learner.escrowBalance += tokenCost;
    await learner.save();

    const session = await Session.create({ mentor: mentorId, learner: req.user.id, skill, tokenCost, status: 'pending' });

    mentor.notifications.push({ message: `📅 New session booked for "${skill}" by ${learner.name}`, type: 'info' });
    await mentor.save();

    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// START SESSION
router.patch('/:id/start', authMiddleware, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('learner', 'name notifications');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.mentor.toString() !== req.user.id) return res.status(403).json({ message: 'Only mentor can start' });
    if (session.status !== 'pending') return res.status(400).json({ message: 'Session cannot be started' });

    session.status = 'active';
    session.startedAt = new Date();
    await session.save();

    const learner = await User.findById(session.learner);
    if (learner) {
      learner.notifications.push({ message: `🟢 Your "${session.skill}" session has started! Join now.`, type: 'success' });
      await learner.save();
    }

    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// END SESSION — mentor ends, tokens released immediately regardless of quiz
// Quiz only affects learner trust score, NOT token release
router.patch('/:id/end', authMiddleware, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.mentor.toString() !== req.user.id) return res.status(403).json({ message: 'Only mentor can end' });
    if (session.status !== 'active') return res.status(400).json({ message: 'Session not active' });

    session.status = 'completed';
    session.endedAt = new Date();
    await session.save();

    // Release escrow to mentor (minus 2% platform fee)
    // FAIR: mentor always gets paid for showing up. Quiz ≠ payment gate.
    const platformFee = Math.floor(session.tokenCost * 0.02);
    const mentorEarning = session.tokenCost - platformFee;

    const learner = await User.findById(session.learner);
    const mentor = await User.findById(session.mentor);

    learner.escrowBalance = Math.max(0, learner.escrowBalance - session.tokenCost);
    await learner.save();

    mentor.walletBalance += mentorEarning;
    mentor.notifications.push({
      message: `💰 Session ended. Earned ${mentorEarning} tokens for "${session.skill}". Please rate your learner!`,
      type: 'success'
    });
    await mentor.save();

    // Notify learner to rate & take quiz
    learner.notifications.push({
      message: `✅ Session ended! Please rate your mentor and take the quiz for "${session.skill}".`,
      type: 'info'
    });
    await learner.save();

    res.json({ message: 'Session ended. Tokens released to mentor.', session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// RATE SESSION — both mentor and learner can rate
router.post('/:id/rate', authMiddleware, async (req, res) => {
  try {
    const { rating, review } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be 1–5' });

    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.status !== 'completed') return res.status(400).json({ message: 'Can only rate completed sessions' });

    const isMentor = session.mentor.toString() === req.user.id;
    const isLearner = session.learner.toString() === req.user.id;
    if (!isMentor && !isLearner) return res.status(403).json({ message: 'Not part of this session' });

    if (isMentor) {
      // Mentor rates learner
      session.learnerRating = rating;
      session.learnerReview = review;
      // Bad learner rating lowers their trust score slightly
      if (rating <= 2) {
        const learner = await User.findById(session.learner);
        learner.trustScore = Math.max(0, learner.trustScore - 2);
        learner.notifications.push({ message: `⚠️ Your mentor gave a low rating for the "${session.skill}" session.`, type: 'warning' });
        await learner.save();
      }
    } else {
      // Learner rates mentor
      session.mentorRating = rating;
      session.mentorReview = review;
      // Update mentor's average trust score based on rating
      const mentor = await User.findById(session.mentor);
      if (rating >= 4) {
        mentor.trustScore = Math.min(100, mentor.trustScore + 2);
        mentor.notifications.push({ message: `⭐ ${rating}/5 rating received for "${session.skill}"!`, type: 'success' });
      } else if (rating <= 2) {
        mentor.trustScore = Math.max(0, mentor.trustScore - 3);
        mentor.notifications.push({ message: `📉 Low rating received (${rating}/5) for "${session.skill}". Please improve your teaching.`, type: 'warning' });
      }
      await mentor.save();
    }

    await session.save();
    res.json({ message: 'Rating submitted!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// RAISE DISPUTE — learner can dispute if mentor didn't teach
router.post('/:id/dispute', authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason required' });

    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.status !== 'completed') return res.status(400).json({ message: 'Can only dispute completed sessions' });

    const isLearner = session.learner.toString() === req.user.id;
    const isMentor = session.mentor.toString() === req.user.id;
    if (!isLearner && !isMentor) return res.status(403).json({ message: 'Not authorized' });

    // Check 24h window
    const hoursSinceEnd = (Date.now() - new Date(session.endedAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceEnd > 24) return res.status(400).json({ message: 'Dispute window (24h) has passed' });

    session.status = 'disputed';
    session.disputeReason = reason;
    session.disputeRaisedBy = isLearner ? 'learner' : 'mentor';
    await session.save();

    // Notify admins via a flag (they'll see it in admin sessions list)
    const mentor = await User.findById(session.mentor);
    const learner = await User.findById(session.learner);
    if (isLearner) {
      mentor.notifications.push({ message: `⚠️ Learner has disputed the "${session.skill}" session. Admin will review.`, type: 'warning' });
      await mentor.save();
    }

    res.json({ message: 'Dispute raised. Admin will review within 24 hours.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CANCEL SESSION (pending only)
router.patch('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.status !== 'pending') return res.status(400).json({ message: 'Only pending sessions can be cancelled' });

    const isMentor = session.mentor.toString() === req.user.id;
    const isLearner = session.learner.toString() === req.user.id;
    if (!isMentor && !isLearner) return res.status(403).json({ message: 'Not authorized' });

    const learner = await User.findById(session.learner);
    learner.walletBalance += session.tokenCost;
    learner.escrowBalance = Math.max(0, learner.escrowBalance - session.tokenCost);
    learner.notifications.push({ message: `↩️ Session cancelled. ${session.tokenCost} tokens refunded.`, type: 'info' });
    await learner.save();

    session.status = 'cancelled';
    await session.save();

    res.json({ message: 'Session cancelled and tokens refunded.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET SINGLE SESSION
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('mentor', 'name email teachingSkills trustScore')
      .populate('learner', 'name email');
    if (!session) return res.status(404).json({ message: 'Not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
