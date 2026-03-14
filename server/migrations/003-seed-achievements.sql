-- Seed 20 achievement definitions
-- Run after 002-phase2-tables.sql

INSERT INTO achievements (key, name, description, icon, category, xp_reward, condition_json) VALUES
('first_focus', 'Primeira Sinapse', 'Complete sua primeira sessao de foco', '🧠', 'focus', 10, '{"type":"pomodoro_count","value":1}'),
('focus_100', 'Centena de Foco', 'Acumule 100 minutos de foco', '⏱️', 'focus', 20, '{"type":"focus_minutes","value":100}'),
('focus_500', 'Maratona Neural', 'Acumule 500 minutos de foco', '🔥', 'focus', 50, '{"type":"focus_minutes","value":500}'),
('focus_2000', 'Mestre da Concentracao', 'Acumule 2000 minutos de foco', '💎', 'focus', 100, '{"type":"focus_minutes","value":2000}'),
('streak_3', 'Trinca Cerebral', 'Mantenha 3 dias seguidos de estudo', '📅', 'streak', 15, '{"type":"streak","value":3}'),
('streak_7', 'Semana de Fogo', 'Mantenha 7 dias seguidos de estudo', '🔥', 'streak', 30, '{"type":"streak","value":7}'),
('streak_30', 'Disciplina Neural', 'Mantenha 30 dias seguidos de estudo', '🏆', 'streak', 100, '{"type":"streak","value":30}'),
('review_10', 'Revisor Ativo', 'Complete 10 revisoes espacadas', '📚', 'review', 15, '{"type":"review_count","value":10}'),
('review_50', 'Memoria de Aco', 'Complete 50 revisoes espacadas', '🧲', 'review', 40, '{"type":"review_count","value":50}'),
('review_100', 'Centenario da Memoria', 'Complete 100 revisoes espacadas', '🏛️', 'review', 60, '{"type":"review_count","value":100}'),
('review_optimal_10', 'Timing Perfeito', '10 revisoes no dia exato do FSRS', '🎯', 'review', 40, '{"type":"optimal_reviews","value":10}'),
('nback_level3', 'Memoria Expandida', 'Alcance nivel 3 no Dual N-Back', '🔢', 'nback', 30, '{"type":"nback_level","value":3}'),
('nback_level4', 'Cortex Turbinado', 'Alcance nivel 4 no Dual N-Back', '⚡', 'nback', 60, '{"type":"nback_level","value":4}'),
('nback_level5', 'Neurocirurgiao Cognitivo', 'Alcance nivel 5 no Dual N-Back', '🧬', 'nback', 100, '{"type":"nback_level","value":5}'),
('nback_sessions_10', 'Treino Consistente', 'Complete 10 sessoes de N-Back', '💪', 'nback', 25, '{"type":"nback_sessions","value":10}'),
('planner_first', 'Planejador Estrategico', 'Crie sua primeira materia com 5+ topicos', '📋', 'planner', 20, '{"type":"planner_subject_topics","value":5}'),
('planner_complete', 'Materia Dominada', 'Complete todos topicos de uma materia', '✅', 'planner', 50, '{"type":"planner_subject_complete","value":1}'),
('diary_7', 'Reflexao Semanal', 'Escreva 7 entradas no diario', '📓', 'diary', 25, '{"type":"diary_count","value":7}'),
('diary_30', 'Cronista Neural', 'Escreva 30 entradas no diario', '📖', 'diary', 60, '{"type":"diary_count","value":30}'),
('all_tools', 'Arsenal Neural', 'Use todas as 7 ferramentas de foco pelo menos uma vez', '🧪', 'tools', 40, '{"type":"tools_used","value":7}')
ON CONFLICT (key) DO NOTHING;
