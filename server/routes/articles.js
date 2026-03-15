const express = require('express');
const path = require('path');
const fs = require('fs');
const { ensureAuth } = require('../middleware/auth');
const { requirePro } = require('../middleware/plan-gate');
const router = express.Router();

const ARTICLES_DIR = path.join(__dirname, '..', '..', 'articles');

const ARTICLES = [
    { file: 'Allen-2024-Desirable-Difficulty.pdf', title: 'Desirable Difficulty — Make Learning Harder on Purpose', authors: 'Allen, M.M.', year: 2024, journal: 'Clinical Orthopaedics and Related Research', category: 'learning' },
    { file: 'AstonJones-Cohen-2005-LC-NE-Function.pdf', title: 'An Integrative Theory of Locus Coeruleus-Norepinephrine Function', authors: 'Aston-Jones, G.; Cohen, J.D.', year: 2005, journal: 'Annual Review of Neuroscience', category: 'attention' },
    { file: 'Au-2015-NBack-Meta-Analysis.pdf', title: 'Improving Fluid Intelligence with Training on Working Memory: A Meta-analysis', authors: 'Au, J. et al.', year: 2015, journal: 'Psychonomic Bulletin & Review', category: 'nback' },
    { file: 'Balban-2023-Structured-Respiration.pdf', title: 'Brief Structured Respiration Practices Enhance Mood and Reduce Physiological Arousal', authors: 'Balban, M.Y. et al.', year: 2023, journal: 'Cell Reports Medicine', category: 'breathing' },
    { file: 'Blain-2025-Cholinergic-Dopamine-Effort.pdf', title: 'Cholinergic Modulation of Dopamine Release Drives Effortful Behaviour', authors: 'Blain, B. et al.', year: 2025, journal: 'Nature', category: 'dopamine' },
    { file: 'Dubinsky-Hamid-2024-Neuroscience-Active-Learning.pdf', title: 'The Neuroscience of Active Learning and Direct Instruction', authors: 'Dubinsky, J.M.; Hamid, A.A.', year: 2024, journal: 'Neuroscience & Biobehavioral Reviews', category: 'learning' },
    { file: 'Gershman-Daw-2017-Reinforcement-Learning.pdf', title: 'Reinforcement Learning and Episodic Memory in Humans and Animals', authors: 'Gershman, S.J.; Daw, N.D.', year: 2017, journal: 'Annual Review of Psychology', category: 'dopamine' },
    { file: 'Jaeggi-2008-Fluid-Intelligence-Working-Memory.pdf', title: 'Improving Fluid Intelligence with Training on Working Memory', authors: 'Jaeggi, S.M. et al.', year: 2008, journal: 'PNAS', category: 'nback' },
    { file: 'Kim-2024-M1-Interleaved-Practice.pdf', title: 'M1 Recruitment During Interleaved Practice Is Important for Encoding', authors: 'Kim, H.E. et al.', year: 2024, journal: 'npj Science of Learning', category: 'learning' },
    { file: 'Kornmeier-2012-Spacing-Behavioral-Cellular.pdf', title: 'Parallels Between Spacing Effects During Behavioral and Cellular Learning', authors: 'Kornmeier, J.; Sosic-Vasic, Z.', year: 2012, journal: 'Frontiers in Human Neuroscience', category: 'spacing' },
    { file: 'Kukushkin-2024-Massed-Spaced-NonNeural.pdf', title: 'The Massed-Spaced Learning Effect in Non-Neural Human Cells', authors: 'Kukushkin, N.V.; Carew, T.J.', year: 2024, journal: 'Nature Communications', category: 'spacing' },
    { file: 'Marek-2023-Hippocampal-Volume-Medical-Students.pdf', title: 'The Impact of Studying on the Hippocampal Volume in Medical Students', authors: 'Marek, J. et al.', year: 2023, journal: 'Polish Journal of Radiology', category: 'learning' },
    { file: 'Samani-Bhatarah-2021-Interleaved-Practice.pdf', title: 'Interleaved Practice Enhances Memory and Problem-Solving Ability', authors: 'Samani, J.; Bhatarah, P.', year: 2021, journal: 'npj Science of Learning', category: 'learning' },
    { file: 'Schultz-2024-Dopamine-Reward-Maximization.pdf', title: 'Dopamine Reward Prediction Error Coding', authors: 'Schultz, W.', year: 2024, journal: 'Behavioral and Brain Sciences', category: 'dopamine' },
    { file: 'Serra-2025-Retrieval-Practice-Health-Professions.pdf', title: 'The Use of Retrieval Practice in the Health Professions', authors: 'Serra, M.J.; England, B.D.', year: 2025, journal: 'Academic Medicine', category: 'learning' },
    { file: 'Sisti-2007-Neurogenesis-Spacing-Effect.pdf', title: 'Neurogenesis and the Spacing Effect: Learning Over Time Enhances Memory', authors: 'Sisti, H.M. et al.', year: 2007, journal: 'Learning & Memory', category: 'spacing' },
    { file: 'Skvortsova-2020-Dopamine-Effort-Reward.pdf', title: 'The Role of Dopamine in Dynamic Effort-Reward Integration', authors: 'Skvortsova, V. et al.', year: 2020, journal: 'Neuropsychopharmacology', category: 'dopamine' },
    { file: 'Soderlund-2007-Noise-Beneficial-ADHD.pdf', title: 'Listen to the Noise: Noise is Beneficial for Cognitive Performance in ADHD', authors: 'Soderlund, G. et al.', year: 2007, journal: 'J Child Psychology', category: 'attention' },
    { file: 'Westbrook-2025-Striatal-Dopamine.pdf', title: 'Striatal Dopamine Enhances Working Memory and Reinforcement Learning', authors: 'Westbrook, A. et al.', year: 2025, journal: 'Nature Communications', category: 'dopamine' },
    { file: 'WiklundHornqvist-2021-Retrieval-Practice-Hippocampus.pdf', title: 'Retrieval Practice Facilitates Learning by Strengthening Processing in Both Hippocampal Regions', authors: 'Wiklund-Hornqvist, C. et al.', year: 2021, journal: 'Brain and Behavior', category: 'learning' },
    { file: 'Xu-2024-Active-Recall-Academic-Achievement.pdf', title: 'Active Recall and Academic Achievement', authors: 'Xu, Y. et al.', year: 2024, journal: 'Behavioral Sciences', category: 'learning' },
    { file: 'Zaccaro-2018-Breath-Control.pdf', title: 'How Breath-Control Can Change Your Life: A Systematic Review', authors: 'Zaccaro, A. et al.', year: 2018, journal: 'Frontiers in Human Neuroscience', category: 'breathing' },
    { file: 'Zhang-2025-Offline-Consolidation-EEG.pdf', title: 'Offline Consolidation Mechanisms of the Retrieval Practice Effect via EEG', authors: 'Zhang, J. et al.', year: 2025, journal: 'npj Science of Learning', category: 'learning' }
];

// GET /api/articles — List all articles (metadata only, available to all authenticated users)
router.get('/', ensureAuth, (req, res) => {
    const list = ARTICLES.map(a => ({
        ...a,
        downloadUrl: `/api/articles/download/${encodeURIComponent(a.file)}`
    }));
    res.json(list);
});

// GET /api/articles/download/:filename — Download PDF (Pro only)
router.get('/download/:filename', ensureAuth, requirePro, (req, res) => {
    const filename = decodeURIComponent(req.params.filename);
    const article = ARTICLES.find(a => a.file === filename);
    if (!article) {
        return res.status(404).json({ error: 'Artigo nao encontrado.' });
    }

    const filePath = path.join(ARTICLES_DIR, article.file);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Arquivo nao disponivel no momento.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${article.file}"`);
    fs.createReadStream(filePath).pipe(res);
});

module.exports = router;
