import { db } from './db';
import crypto from 'crypto';

export const upsertCheckin = (checkin: any) => {
  const now = new Date().toISOString();
  // Ensure one checkin per item per day
  const id = crypto.createHash('md5').update(`${checkin.date}_${checkin.category}_${checkin.itemKey}`).digest('hex');
  
  db.prepare(`
    INSERT INTO task_checkins (
      id, date, category, item_key, item_label, status, source, confidence, linked_run_id, notes, created_at, updated_at
    ) VALUES (
      @id, @date, @category, @item_key, @item_label, @status, @source, @confidence, @linked_run_id, @notes, @created_at, @updated_at
    )
    ON CONFLICT(id) DO UPDATE SET
      status=excluded.status,
      confidence=excluded.confidence,
      linked_run_id=excluded.linked_run_id,
      notes=excluded.notes,
      updated_at=excluded.updated_at
  `).run({
    id,
    date: checkin.date,
    category: checkin.category,
    item_key: checkin.itemKey,
    item_label: checkin.itemLabel,
    status: checkin.status,
    source: checkin.source || 'dashboard',
    confidence: checkin.confidence || 'high',
    linked_run_id: checkin.linkedRunId || null,
    notes: checkin.notes || null,
    created_at: now,
    updated_at: now
  });
};

export const getCheckinsByDate = (date: string) => {
  return db.prepare('SELECT * FROM task_checkins WHERE date = ?').all(date);
};

export const getTodayCheckins = () => {
  const today = new Date().toISOString().split('T')[0];
  return getCheckinsByDate(today);
};

export const upsertDailyReflection = (reflection: any) => {
  db.prepare(`
    INSERT INTO daily_reflections (
      date, energy_level, mood, sleep_quality, soreness_level, skin_status, focus_quality, biggest_win, main_blocker, tomorrow_adjustment, notes, updated_at
    ) VALUES (
      @date, @energy_level, @mood, @sleep_quality, @soreness_level, @skin_status, @focus_quality, @biggest_win, @main_blocker, @tomorrow_adjustment, @notes, @updated_at
    )
    ON CONFLICT(date) DO UPDATE SET
      energy_level=excluded.energy_level,
      mood=excluded.mood,
      sleep_quality=excluded.sleep_quality,
      soreness_level=excluded.soreness_level,
      skin_status=excluded.skin_status,
      focus_quality=excluded.focus_quality,
      biggest_win=excluded.biggest_win,
      main_blocker=excluded.main_blocker,
      tomorrow_adjustment=excluded.tomorrow_adjustment,
      notes=excluded.notes,
      updated_at=excluded.updated_at
  `).run({
    date: reflection.date,
    energy_level: reflection.energyLevel ?? null,
    mood: reflection.mood || null,
    sleep_quality: reflection.sleepQuality ?? null,
    soreness_level: reflection.sorenessLevel ?? null,
    skin_status: reflection.skinStatus || null,
    focus_quality: reflection.focusQuality ?? null,
    biggest_win: reflection.biggestWin || null,
    main_blocker: reflection.mainBlocker || null,
    tomorrow_adjustment: reflection.tomorrowAdjustment || null,
    notes: reflection.notes || null,
    updated_at: new Date().toISOString()
  });
};

export const getDailyReflection = (date: string) => {
  return db.prepare('SELECT * FROM daily_reflections WHERE date = ?').get(date) || null;
};
