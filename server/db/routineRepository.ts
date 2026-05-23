import { db } from './db';
import crypto from 'crypto';

// Types
interface RoutineOverride {
  date: string;
  mode: string;
  reason?: string;
  affectedCategory?: string;
  replacementProtocolId?: string;
  notes?: string;
}

export const seedDefaultRoutineProtocols = () => {
  const now = new Date().toISOString();

  const protocols = [
    { id: 'gym_monday_back_chest', category: 'gym', title: 'Back + Chest', description: 'Heavy back and chest focus', intensity: 'high', estimated_minutes: 90, safety_notes: '' },
    { id: 'gym_tuesday_biceps_triceps', category: 'gym', title: 'Biceps + Triceps', description: 'Arm day', intensity: 'medium', estimated_minutes: 60, safety_notes: '' },
    { id: 'gym_wednesday_legs', category: 'gym', title: 'Quads + Hamstrings', description: 'Heavy leg day', intensity: 'high', estimated_minutes: 90, safety_notes: '' },
    { id: 'gym_thursday_shoulders_traps', category: 'gym', title: 'Shoulders + Traps', description: 'Shoulders focus', intensity: 'medium', estimated_minutes: 60, safety_notes: 'Avoid behind-the-neck press by default. Prefer shoulder press machine or dumbbell shoulder press. Include face pulls for shoulder health.' },
    { id: 'gym_friday_back_chest_pump', category: 'gym', title: 'Back + Chest (Pump)', description: 'Controlled/pump focus', intensity: 'medium', estimated_minutes: 60, safety_notes: '' },
    { id: 'gym_saturday_arms_finisher', category: 'gym', title: 'Biceps + Triceps + Finisher', description: 'Repeat arms with lighter/pump focus + optional cardio finisher', intensity: 'medium', estimated_minutes: 75, safety_notes: 'Optional finisher (battle rope, bike, sled) only if energy is good.' },
    { id: 'gym_sunday_recovery', category: 'gym', title: 'Active Recovery', description: 'Rest and recovery', intensity: 'low', estimated_minutes: 30, safety_notes: '' },
    
    { id: 'skincare_morning', category: 'skincare', title: 'Morning Skincare', description: 'AM routine after post-gym shower', intensity: 'low', estimated_minutes: 5, safety_notes: 'Skip azelaic if irritated, dry, burning, or peeling.' },
    { id: 'skincare_night_adapalene', category: 'skincare', title: 'Adapalene Night', description: 'Night skincare with Adapalene', intensity: 'medium', estimated_minutes: 5, safety_notes: 'Use at night only. Apply a pea-sized amount thinly across acne-prone areas, not just one pimple. Avoid eyes, eyelids, lips, corners of nose, and irritated/broken skin. Moisturize after or use moisturizer sandwich if dry. Use sunscreen the next morning. Skip adapalene if skin is irritated, burning, peeling, or very dry.' },
    { id: 'skincare_night_bha', category: 'skincare', title: 'BHA Night', description: 'Night skincare with BHA', intensity: 'medium', estimated_minutes: 5, safety_notes: 'Use only on scheduled BHA nights. Do not combine with adapalene on the same night. Avoid if irritated or over-dry. Moisturize after.' },
    { id: 'skincare_night_recovery', category: 'skincare', title: 'Recovery Night', description: 'Rest barrier', intensity: 'low', estimated_minutes: 5, safety_notes: 'Gentle cleanse if needed. Moisturizer only. No actives, no BHA, no adapalene, no scrubs. Protect skin barrier.' },

    { id: 'bodycare_post_gym', category: 'bodycare', title: 'Post-Gym Body Care', description: 'Shower and hygiene', intensity: 'low', estimated_minutes: 15, safety_notes: '' },
    { id: 'bodycare_night', category: 'bodycare', title: 'Night Body Care', description: 'Underarm and stretch mark care', intensity: 'low', estimated_minutes: 5, safety_notes: '' },
    { id: 'bodycare_sunday_skin_check', category: 'bodycare', title: 'Weekly Skin-Check', description: 'Photo tracking', intensity: 'low', estimated_minutes: 5, safety_notes: '' },
  ];

  const steps = [
    // Gym Monday
    { id: 'step_m_1', protocol_id: 'gym_monday_back_chest', step_order: 1, title: 'Bend-over barbell row' },
    { id: 'step_m_2', protocol_id: 'gym_monday_back_chest', step_order: 2, title: 'Smith machine bench press' },
    { id: 'step_m_3', protocol_id: 'gym_monday_back_chest', step_order: 3, title: 'Front lat pulldown' },
    { id: 'step_m_4', protocol_id: 'gym_monday_back_chest', step_order: 4, title: 'Decline dumbbell fly' },
    { id: 'step_m_5', protocol_id: 'gym_monday_back_chest', step_order: 5, title: 'Seated row machine' },
    { id: 'step_m_6', protocol_id: 'gym_monday_back_chest', step_order: 6, title: 'Cable crossover' },
    
    // Gym Tuesday
    { id: 'step_t_1', protocol_id: 'gym_tuesday_biceps_triceps', step_order: 1, title: 'Lying cable extension' },
    { id: 'step_t_2', protocol_id: 'gym_tuesday_biceps_triceps', step_order: 2, title: 'Standing barbell curl' },
    { id: 'step_t_3', protocol_id: 'gym_tuesday_biceps_triceps', step_order: 3, title: 'Seated cable extension' },
    { id: 'step_t_4', protocol_id: 'gym_tuesday_biceps_triceps', step_order: 4, title: 'Preacher curl machine' },
    { id: 'step_t_5', protocol_id: 'gym_tuesday_biceps_triceps', step_order: 5, title: 'Cable pushdown' },
    { id: 'step_t_6', protocol_id: 'gym_tuesday_biceps_triceps', step_order: 6, title: 'Seated dumbbell curl' },
    
    // Gym Wednesday
    { id: 'step_w_1', protocol_id: 'gym_wednesday_legs', step_order: 1, title: 'Sissy squat' },
    { id: 'step_w_2', protocol_id: 'gym_wednesday_legs', step_order: 2, title: 'Stiff-leg deadlift' },
    { id: 'step_w_3', protocol_id: 'gym_wednesday_legs', step_order: 3, title: 'Smith squat' },
    { id: 'step_w_4', protocol_id: 'gym_wednesday_legs', step_order: 4, title: '45-degree leg press' },
    { id: 'step_w_5', protocol_id: 'gym_wednesday_legs', step_order: 5, title: 'Leg extension' },
    { id: 'step_w_6', protocol_id: 'gym_wednesday_legs', step_order: 6, title: 'Leg curl' },
    { id: 'step_w_7', protocol_id: 'gym_wednesday_legs', step_order: 7, title: 'Seated calf raise' },
    { id: 'step_w_8', protocol_id: 'gym_wednesday_legs', step_order: 8, title: 'Standing calf raise' },
    
    // Gym Thursday
    { id: 'step_th_1', protocol_id: 'gym_thursday_shoulders_traps', step_order: 1, title: 'Shoulder press variation (Machine/Dumbbell)' },
    { id: 'step_th_2', protocol_id: 'gym_thursday_shoulders_traps', step_order: 2, title: 'Reverse pec deck' },
    { id: 'step_th_3', protocol_id: 'gym_thursday_shoulders_traps', step_order: 3, title: 'Front dumbbell raise' },
    { id: 'step_th_4', protocol_id: 'gym_thursday_shoulders_traps', step_order: 4, title: 'Dumbbell shrugs' },
    { id: 'step_th_5', protocol_id: 'gym_thursday_shoulders_traps', step_order: 5, title: 'Shoulder press machine' },
    { id: 'step_th_6', protocol_id: 'gym_thursday_shoulders_traps', step_order: 6, title: 'Rope face pull' },
    
    // Gym Friday
    { id: 'step_f_1', protocol_id: 'gym_friday_back_chest_pump', step_order: 1, title: 'Row movement' },
    { id: 'step_f_2', protocol_id: 'gym_friday_back_chest_pump', step_order: 2, title: 'Press movement' },
    { id: 'step_f_3', protocol_id: 'gym_friday_back_chest_pump', step_order: 3, title: 'Pulldown movement' },
    { id: 'step_f_4', protocol_id: 'gym_friday_back_chest_pump', step_order: 4, title: 'Chest isolation' },
    { id: 'step_f_5', protocol_id: 'gym_friday_back_chest_pump', step_order: 5, title: 'Seated row or cable row' },
    { id: 'step_f_6', protocol_id: 'gym_friday_back_chest_pump', step_order: 6, title: 'Cable chest finisher' },
    
    // Gym Saturday
    { id: 'step_s_1', protocol_id: 'gym_saturday_arms_finisher', step_order: 1, title: 'Lying cable extension' },
    { id: 'step_s_2', protocol_id: 'gym_saturday_arms_finisher', step_order: 2, title: 'Standing barbell curl' },
    { id: 'step_s_3', protocol_id: 'gym_saturday_arms_finisher', step_order: 3, title: 'Optional Finisher: Battle rope, Bike, or Sled' },
    
    // Gym Sunday
    { id: 'step_su_1', protocol_id: 'gym_sunday_recovery', step_order: 1, title: '20-30 min walk' },
    { id: 'step_su_2', protocol_id: 'gym_sunday_recovery', step_order: 2, title: 'Light stretch' },
    { id: 'step_su_3', protocol_id: 'gym_sunday_recovery', step_order: 3, title: 'Hydration & Weekly Prep' },

    // Skincare
    { id: 'step_sk_m1', protocol_id: 'skincare_morning', step_order: 1, title: 'Gentle cleanser (if needed)' },
    { id: 'step_sk_m2', protocol_id: 'skincare_morning', step_order: 2, title: 'Azelaic acid (if calm)' },
    { id: 'step_sk_m3', protocol_id: 'skincare_morning', step_order: 3, title: 'Moisturizer' },
    { id: 'step_sk_m4', protocol_id: 'skincare_morning', step_order: 4, title: 'Sunscreen' },

    { id: 'step_sk_na1', protocol_id: 'skincare_night_adapalene', step_order: 1, title: 'Cleanse' },
    { id: 'step_sk_na2', protocol_id: 'skincare_night_adapalene', step_order: 2, title: 'Pea-sized Adapalene on acne-prone areas' },
    { id: 'step_sk_na3', protocol_id: 'skincare_night_adapalene', step_order: 3, title: 'Moisturizer' },

    { id: 'step_sk_nb1', protocol_id: 'skincare_night_bha', step_order: 1, title: 'Cleanse' },
    { id: 'step_sk_nb2', protocol_id: 'skincare_night_bha', step_order: 2, title: 'BHA Application' },
    { id: 'step_sk_nb3', protocol_id: 'skincare_night_bha', step_order: 3, title: 'Moisturizer' },

    { id: 'step_sk_nr1', protocol_id: 'skincare_night_recovery', step_order: 1, title: 'Gentle cleanse' },
    { id: 'step_sk_nr2', protocol_id: 'skincare_night_recovery', step_order: 2, title: 'Moisturizer (thick layer if dry)' },

    // Body Care
    { id: 'step_bc_1', protocol_id: 'bodycare_post_gym', step_order: 1, title: 'Back acne wash' },
    { id: 'step_bc_2', protocol_id: 'bodycare_post_gym', step_order: 2, title: 'Butt bumps wash/care' },
    { id: 'step_bc_3', protocol_id: 'bodycare_post_gym', step_order: 3, title: 'Dry properly & clean clothes' },
    
    { id: 'step_bc_n1', protocol_id: 'bodycare_night', step_order: 1, title: 'Underarm care' },
    { id: 'step_bc_n2', protocol_id: 'bodycare_night', step_order: 2, title: 'Stretch mark care' },
  ];

  const schedules = [
    { id: 'sched_m_gym', day_of_week: 'Monday', time_block: '7:00 AM', category: 'gym', protocol_id: 'gym_monday_back_chest', label: 'Gym Block' },
    { id: 'sched_t_gym', day_of_week: 'Tuesday', time_block: '7:00 AM', category: 'gym', protocol_id: 'gym_tuesday_biceps_triceps', label: 'Gym Block' },
    { id: 'sched_w_gym', day_of_week: 'Wednesday', time_block: '7:00 AM', category: 'gym', protocol_id: 'gym_wednesday_legs', label: 'Gym Block' },
    { id: 'sched_th_gym', day_of_week: 'Thursday', time_block: '7:00 AM', category: 'gym', protocol_id: 'gym_thursday_shoulders_traps', label: 'Gym Block' },
    { id: 'sched_f_gym', day_of_week: 'Friday', time_block: '7:00 AM', category: 'gym', protocol_id: 'gym_friday_back_chest_pump', label: 'Gym Block' },
    { id: 'sched_s_gym', day_of_week: 'Saturday', time_block: '7:00 AM', category: 'gym', protocol_id: 'gym_saturday_arms_finisher', label: 'Gym Block' },
    { id: 'sched_su_gym', day_of_week: 'Sunday', time_block: '9:00 AM', category: 'gym', protocol_id: 'gym_sunday_recovery', label: 'Active Recovery' },
    
    { id: 'sched_m_skin_night', day_of_week: 'Monday', time_block: '9:00 PM', category: 'skincare_night', protocol_id: 'skincare_night_bha', label: 'BHA Night' },
    { id: 'sched_t_skin_night', day_of_week: 'Tuesday', time_block: '9:00 PM', category: 'skincare_night', protocol_id: 'skincare_night_adapalene', label: 'Adapalene Night' },
    { id: 'sched_w_skin_night', day_of_week: 'Wednesday', time_block: '9:00 PM', category: 'skincare_night', protocol_id: 'skincare_night_recovery', label: 'Recovery Night' },
    { id: 'sched_th_skin_night', day_of_week: 'Thursday', time_block: '9:00 PM', category: 'skincare_night', protocol_id: 'skincare_night_adapalene', label: 'Adapalene Night' },
    { id: 'sched_f_skin_night', day_of_week: 'Friday', time_block: '9:00 PM', category: 'skincare_night', protocol_id: 'skincare_night_bha', label: 'BHA Night' },
    { id: 'sched_s_skin_night', day_of_week: 'Saturday', time_block: '9:00 PM', category: 'skincare_night', protocol_id: 'skincare_night_recovery', label: 'Recovery Night' },
    { id: 'sched_su_skin_night', day_of_week: 'Sunday', time_block: '9:00 PM', category: 'skincare_night', protocol_id: 'skincare_night_adapalene', label: 'Adapalene Night + Photo' },
  ];

  db.transaction(() => {
    const insertProtocol = db.prepare(`
      INSERT INTO routine_protocols (id, category, title, description, intensity, estimated_minutes, safety_notes, created_at, updated_at) 
      VALUES (@id, @category, @title, @description, @intensity, @estimated_minutes, @safety_notes, @now, @now)
      ON CONFLICT(id) DO UPDATE SET title=excluded.title, description=excluded.description, safety_notes=excluded.safety_notes
    `);
    
    for (const p of protocols) {
      insertProtocol.run({ ...p, now });
    }

    const insertStep = db.prepare(`
      INSERT INTO routine_steps (id, protocol_id, step_order, title, created_at)
      VALUES (@id, @protocol_id, @step_order, @title, @now)
      ON CONFLICT(id) DO UPDATE SET title=excluded.title, step_order=excluded.step_order
    `);
    
    for (const s of steps) {
      insertStep.run({ ...s, now });
    }

    const insertSched = db.prepare(`
      INSERT INTO weekly_routine_schedule (id, day_of_week, time_block, category, protocol_id, label, created_at)
      VALUES (@id, @day_of_week, @time_block, @category, @protocol_id, @label, @now)
      ON CONFLICT(id) DO UPDATE SET protocol_id=excluded.protocol_id, label=excluded.label
    `);
    
    for (const sc of schedules) {
      insertSched.run({ ...sc, now });
    }
  })();
};

export const getRoutineProtocols = () => {
  const protocols = db.prepare('SELECT * FROM routine_protocols WHERE is_active = 1').all() as any[];
  const steps = db.prepare('SELECT * FROM routine_steps ORDER BY step_order ASC').all() as any[];
  
  return protocols.map(p => ({
    ...p,
    steps: steps.filter(s => s.protocol_id === p.id)
  }));
};

export const getProtocolById = (id: string) => {
  const p = db.prepare('SELECT * FROM routine_protocols WHERE id = ?').get(id) as any;
  if (!p) return null;
  const steps = db.prepare('SELECT * FROM routine_steps WHERE protocol_id = ? ORDER BY step_order ASC').all(id);
  return { ...p, steps };
};

export const getWeeklyRoutineSchedule = () => {
  return db.prepare('SELECT * FROM weekly_routine_schedule').all();
};

export const getRoutineOverridesByDate = (date: string) => {
  return db.prepare('SELECT * FROM routine_overrides WHERE date = ? ORDER BY created_at DESC').all(date);
};

export const createRoutineOverride = (override: RoutineOverride) => {
  const now = new Date().toISOString();
  const id = crypto.randomUUID().replace(/-/g, '');
  
  db.prepare(`
    INSERT INTO routine_overrides (id, date, mode, reason, affected_category, replacement_protocol_id, notes, created_at)
    VALUES (@id, @date, @mode, @reason, @affected_category, @replacement_protocol_id, @notes, @created_at)
  `).run({
    id,
    date: override.date,
    mode: override.mode,
    reason: override.reason || null,
    affected_category: override.affectedCategory || null,
    replacement_protocol_id: override.replacementProtocolId || null,
    notes: override.notes || null,
    created_at: now
  });

  generateDailyRoutinePlan(override.date);
};

const getDayOfWeekString = (dateObj: Date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dateObj.getDay()];
};

export const generateDailyRoutinePlan = (dateStr: string) => {
  const dateObj = new Date(dateStr + "T12:00:00Z"); // Neutral time to avoid tz shifting
  const dayOfWeek = getDayOfWeekString(dateObj);
  
  const schedules = getWeeklyRoutineSchedule() as any[];
  const daySchedule = schedules.filter(s => s.day_of_week === dayOfWeek);
  
  const gymSched = daySchedule.find(s => s.category === 'gym');
  const nightSkinSched = daySchedule.find(s => s.category === 'skincare_night');
  
  let gymProtocol = gymSched ? getProtocolById(gymSched.protocol_id) : null;
  let nightSkincareProtocol = nightSkinSched ? getProtocolById(nightSkinSched.protocol_id) : null;
  let morningSkincareProtocol = getProtocolById('skincare_morning');
  
  let bodyCare = [
    getProtocolById('bodycare_post_gym'),
    getProtocolById('bodycare_night')
  ];

  if (dayOfWeek === 'Sunday') {
    bodyCare.push(getProtocolById('bodycare_sunday_skin_check'));
  }

  // Study & Food default blocks
  const studyBlocks = [
    { time: '11:15 AM', label: 'Study Block 1' },
    { time: '1:45 PM', label: 'Study Block 2' },
    { time: '4:15 PM', label: 'Study Block 3' }
  ];
  const foodBlocks = [
    { time: '10:00 AM', label: 'Morning cooking / prep' },
    { time: '10:45 AM', label: 'Breakfast' },
    { time: '6:45 PM', label: 'Evening cooking' },
    { time: '7:45 PM', label: 'Dinner' }
  ];
  const sleepRoutine = [
    { time: '8:15 PM', label: 'Room reset' },
    { time: '8:30 PM', label: 'Buffer' },
    { time: '9:00 PM', label: 'Night self-care block' },
    { time: '10:15 PM', label: 'Reading' },
    { time: '11:15 PM', label: 'Sleep wind-down' }
  ];

  let warnings: string[] = [];
  const overrides = getRoutineOverridesByDate(dateStr) as any[];
  const dynamicAdjustmentsApplied = [];

  for (const override of overrides) {
    dynamicAdjustmentsApplied.push(override.mode);

    if (override.mode === 'skin_irritated') {
      nightSkincareProtocol = getProtocolById('skincare_night_recovery');
      warnings.push("Skin irritated: skip BHA/adapalene and use recovery routine. Skip morning azelaic.");
    }
    else if (override.mode === 'late_wakeup') {
      gymProtocol = { ...gymProtocol, title: gymProtocol.title + ' (Shortened)' };
      warnings.push("Late wakeup: Compress day, short gym/walk, preserve shower/skincare, keep 1 deep study block.");
    }
    else if (override.mode === 'tired') {
      gymProtocol = { ...gymProtocol, title: 'Short gym or walk (Tired mode)' };
      warnings.push("Tired: Minimum viable day. Short gym/walk. One meaningful task. Early sleep.");
    }
    else if (override.mode === 'skip_gym') {
      gymProtocol = { ...gymProtocol, title: 'Gym Skipped -> Walk/Mobility' };
      warnings.push("Gym skipped: Replace with 20-30 min walk or 10 min mobility. Keep skincare/food stable.");
    }
    else if (override.mode === 'employer_meeting') {
      warnings.push("Employer meeting: Prep is top priority. Shorten gym if needed. Reduce study load.");
    }
    else if (override.mode === 'work_emergency') {
      gymProtocol = { ...gymProtocol, title: 'Gym Short/Skipped (Emergency)' };
      warnings.push("Work emergency: Emergency work is main priority. Minimum skincare. Simple meals.");
    }
  }

  const planObj = {
    date: dateStr,
    dayOfWeek,
    generatedAt: new Date().toISOString(),
    gymProtocol,
    skincareProtocol: {
      morning: morningSkincareProtocol,
      night: nightSkincareProtocol
    },
    bodyCare,
    studyBlocks,
    foodBlocks,
    sleepRoutine,
    dynamicAdjustmentsApplied,
    nextAction: { title: "Check Schedule", type: "system" },
    warnings
  };

  db.prepare(`
    INSERT INTO daily_routine_plan (date, generated_at, plan_json, source, confidence)
    VALUES (@date, @generated_at, @plan_json, @source, @confidence)
    ON CONFLICT(date) DO UPDATE SET 
      generated_at=excluded.generated_at,
      plan_json=excluded.plan_json,
      source=excluded.source,
      confidence=excluded.confidence
  `).run({
    date: dateStr,
    generated_at: planObj.generatedAt,
    plan_json: JSON.stringify(planObj),
    source: 'generated_from_protocols',
    confidence: 'high'
  });

  return planObj;
};

export const getTodayRoutinePlan = (dateStr?: string) => {
  const date = dateStr || new Date().toISOString().split('T')[0];
  const existing = db.prepare('SELECT * FROM daily_routine_plan WHERE date = ?').get(date) as any;
  
  if (existing && existing.plan_json) {
    return JSON.parse(existing.plan_json);
  }
  
  return generateDailyRoutinePlan(date);
};
