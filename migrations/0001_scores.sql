-- Anonymous daily score histogram: one row per (day, score) pair.
CREATE TABLE IF NOT EXISTS scores (
	day INTEGER NOT NULL,
	score INTEGER NOT NULL,
	count INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY (day, score)
);
