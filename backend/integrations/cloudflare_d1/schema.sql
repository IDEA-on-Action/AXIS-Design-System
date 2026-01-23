-- ============================================================
-- AX Discovery Portal - Cloudflare D1 Schema
-- ============================================================

-- Signals 테이블
CREATE TABLE IF NOT EXISTS signals (
    id TEXT PRIMARY KEY,
    activity_id TEXT,
    title TEXT NOT NULL,
    summary TEXT,
    pain_points TEXT,
    opportunities TEXT,
    customer_segment TEXT,
    industry TEXT,
    stage TEXT DEFAULT 'S0',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Scorecards 테이블
CREATE TABLE IF NOT EXISTS scorecards (
    id TEXT PRIMARY KEY,
    signal_id TEXT NOT NULL,
    total_score INTEGER DEFAULT 0,
    market_fit INTEGER DEFAULT 0,
    kt_synergy INTEGER DEFAULT 0,
    technical_feasibility INTEGER DEFAULT 0,
    urgency INTEGER DEFAULT 0,
    revenue_potential INTEGER DEFAULT 0,
    recommendation TEXT DEFAULT 'HOLD',
    evaluator_notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (signal_id) REFERENCES signals(id)
);

-- Briefs 테이블
CREATE TABLE IF NOT EXISTS briefs (
    id TEXT PRIMARY KEY,
    signal_id TEXT,
    scorecard_id TEXT,
    title TEXT NOT NULL,
    executive_summary TEXT,
    problem_statement TEXT,
    proposed_solution TEXT,
    target_customer TEXT,
    business_model TEXT,
    competitive_advantage TEXT,
    next_steps TEXT,
    status TEXT DEFAULT 'DRAFT',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (signal_id) REFERENCES signals(id),
    FOREIGN KEY (scorecard_id) REFERENCES scorecards(id)
);

-- Plays 테이블
CREATE TABLE IF NOT EXISTS plays (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner TEXT,
    status TEXT DEFAULT 'active',
    activity_count INTEGER DEFAULT 0,
    last_activity_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Activities 테이블
CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    play_id TEXT,
    title TEXT NOT NULL,
    url TEXT,
    activity_type TEXT DEFAULT 'seminar',
    source TEXT,
    summary TEXT,
    key_insights TEXT,
    status TEXT DEFAULT 'NEW',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (play_id) REFERENCES plays(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_signals_stage ON signals(stage);
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals(created_at);
CREATE INDEX IF NOT EXISTS idx_scorecards_signal_id ON scorecards(signal_id);
CREATE INDEX IF NOT EXISTS idx_scorecards_recommendation ON scorecards(recommendation);
CREATE INDEX IF NOT EXISTS idx_briefs_status ON briefs(status);
CREATE INDEX IF NOT EXISTS idx_briefs_signal_id ON briefs(signal_id);
CREATE INDEX IF NOT EXISTS idx_plays_status ON plays(status);
CREATE INDEX IF NOT EXISTS idx_activities_play_id ON activities(play_id);
