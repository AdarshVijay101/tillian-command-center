import { getTodayRoutinePlan } from '../db/routineRepository';

export function generateReminderPayload(type: string, date?: string) {
  const dateToUse = date || new Date().toISOString().split('T')[0];
  const plan = getTodayRoutinePlan(dateToUse);

  let title = '';
  let message = '';
  let sections: any[] = [];
  
  // Helpers
  const E_Gym = '🏋️';
  const E_Skin = '🧴';
  const E_Shower = '🚿';
  const E_Study = '📚';
  const E_Food = '🍱';
  const E_Sleep = '😴';
  const E_Target = '🎯';
  const E_Warn = '⚠️';
  const E_Arrow = '👉';
  const E_Check = '✅';
  const E_Walk = '🚶';

  switch (type) {
    case 'wake':
      title = `Wake Up - ${plan.dayOfWeek}`;
      message = `${E_Target} Good Morning - ${plan.dayOfWeek}\n\n`;
      message += `Today's Focus:\n`;
      if (plan.gymProtocol) {
        message += `- Gym: ${plan.gymProtocol.title}\n`;
      }
      if (plan.skincareProtocol?.morning) {
        message += `- Skincare: ${plan.skincareProtocol.morning.title}\n`;
      }
      message += `\nFirst Steps:\n`;
      message += `- Water\n`;
      message += `- Light movement or stretch\n`;
      message += `- Prepare for gym\n`;
      message += `\n${E_Arrow} Next:\nGet to the gym. No phone scrolling first.`;
      break;

    case 'gym':
      title = `Gym Block - ${plan.dayOfWeek}`;
      const gym = plan.gymProtocol;
      if (gym) {
        message = `${E_Gym} Gym Reminder - ${plan.dayOfWeek}\n\n`;
        message += `${E_Target} Today: ${gym.title}\n`;
        if (gym.description) {
          message += `Goal: ${gym.description}\n`;
        }
        message += `\nExercises:\n`;
        if (gym.steps && gym.steps.length > 0) {
          gym.steps.forEach((step: any) => {
            message += `- ${step.title}\n`;
          });
        }
        if (gym.safety_notes) {
          message += `\n${E_Warn} Safety:\n${gym.safety_notes}\n`;
        }
        message += `\nFocus:\nControlled reps. No ego lifting. Stop if sharp joint pain.\n`;
      } else {
        message = `${E_Gym} Gym Reminder - ${plan.dayOfWeek}\nNo specific gym plan for today. Rest or active recovery.`;
      }
      break;

    case 'post_gym_bodycare':
      title = 'Post-Gym Body Care';
      message = `${E_Shower} Post-Gym Shower + Body Care\n\nDo during this shower:\n`;
      const bcPost = plan.bodyCare?.find((bc: any) => bc.id.includes('post_gym'));
      if (bcPost && bcPost.steps) {
        bcPost.steps.forEach((s: any) => {
          message += `- ${s.title}\n`;
        });
      } else {
        message += `- Back acne wash\n- Butt bumps wash/care\n- Wash properly\n- Dry properly\n- Change into clean clothes\n`;
      }
      message += `\n${E_Arrow} Next:\nDo morning skincare after this shower.`;
      break;

    case 'morning_skincare':
      title = 'Morning Skincare';
      const skinM = plan.skincareProtocol?.morning;
      message = `${E_Skin} Morning Skincare\n\nToday: ${skinM?.title || 'Basic Routine'}\n\nSteps:\n`;
      if (skinM && skinM.steps) {
        skinM.steps.forEach((s: any) => {
          message += `- ${s.title}\n`;
        });
      } else {
        message += `- Gentle cleanser if needed\n- Moisturizer\n- Sunscreen SPF 30-50\n`;
      }
      if (skinM?.safety_notes) {
        message += `\n${E_Warn} Important:\n${skinM.safety_notes}\n`;
      }
      message += `\n${E_Check} Non-negotiable:\nSunscreen during the day.`;
      break;

    case 'night_skincare':
      const isIrritated = plan.dynamicAdjustmentsApplied?.includes('skin_irritated');
      title = 'Night Skincare';
      const skinN = plan.skincareProtocol?.night;
      
      if (isIrritated) {
        message = `${E_Skin} Night Skincare - Recovery Night\n\nSkin irritation mode is active.\n\nTonight:\n`;
        message += `- No adapalene\n- No BHA\n- No scrubs\n- Gentle cleanse if needed\n- Moisturizer only\n`;
        message += `\nGoal:\nProtect skin barrier and recover.`;
      } else {
        message = `${E_Skin} Night Skincare - ${skinN?.title || 'Basic Night'}\n\nTonight: ${skinN?.title}\n\nSteps:\n`;
        if (skinN && skinN.steps) {
          skinN.steps.forEach((s: any) => {
            message += `- ${s.title}\n`;
          });
        }
        if (skinN?.safety_notes) {
          message += `\n${E_Warn} Important:\n${skinN.safety_notes}\n`;
        }
        if (skinN?.title?.includes('Adapalene')) {
          message += `\nSkip adapalene if skin is irritated, burning, peeling, or very dry.\nUse sunscreen tomorrow morning.`;
        }
      }
      break;

    case 'study1':
      title = 'Study Block 1';
      message = `${E_Study} Study Block 1 - Deep Work\n\nTime target:\n11:15 AM - 1:15 PM\n\nGoal:\nOne measurable output.\n\nFocus:\n- Hardest topic first\n- No passive watching\n- End with notes, code, or a small deliverable\n\n${E_Arrow} Next:\nStart with the task that creates the most career value.`;
      break;
      
    case 'study2':
      title = 'Study Block 2';
      message = `${E_Study} Study Block 2 - Practice / Project Work\n\nTime target:\n1:45 PM - 3:45 PM\n\nGoal:\nBuild or solve something measurable.\n\nFocus:\n- Coding\n- Project work\n- Notes\n- Interview prep\n- Practice problems\n\nRule:\nDo not passively watch. Produce output.\n\n${E_Arrow} Next:\nPick one task and finish a small deliverable before this block ends.`;
      break;
      
    case 'study3':
      title = 'Study Block 3';
      message = `${E_Study} Study Block 3 - Review / Finish Block\n\nTime target:\n4:15 PM - 6:15 PM\n\nGoal:\nEnd the study day with completion, not scattered effort.\n\nFocus:\n- Review notes\n- Continue project work\n- Finish one pending item\n\nRule:\nDo not start a huge new topic unless energy is high.\n\n${E_Arrow} Next:\nClose the loop on one useful thing before evening walk.`;
      break;

    case 'evening_walk':
      title = 'Evening Walk';
      message = `${E_Walk} Evening Walk\n\nTime target:\n6:15 PM - 6:45 PM\n\nDo:\n- Walk 20-30 minutes\n- Reset your mind\n- Let your eyes rest from screens\n\nRule:\nThis is not a workout. This is a reset.\n\n${E_Arrow} Next:\nCome back and start evening cooking calmly.`;
      break;

    case 'evening_cooking':
    case 'dinner':
      title = 'Evening Cooking / Dinner';
      message = `${E_Food} Evening Cooking / Dinner Prep\n\nKeep it simple:\n- Protein\n- Carb\n- Vegetables or greens\n- Water\n\n${E_Warn} Rule:\nEasy and consistent beats perfect and skipped.`;
      break;

    case 'reading':
      title = 'Reading Block';
      message = `${E_Study} Reading Block\n\nTime target:\n10:15 PM - 11:15 PM\n\nDo:\n- Read 30-60 minutes\n- Keep phone away\n- Keep light low\n\nRule:\nThis is not study. This is calm reading.\n\n${E_Arrow} Next:\nAfter reading, move into sleep wind-down without phone.`;
      break;

    case 'sleep':
      title = 'Sleep Wind-Down';
      message = `${E_Sleep} Sleep Wind-Down\n\nDo:\n- No phone\n- Lights low\n- Prepare for sleep\n- Protect tomorrow's gym, skin, and focus\n\nTarget:\n11:30 PM lights out.\n\n${E_Arrow} Next:\nPut the phone away and let the day end cleanly.`;
      break;

    case 'dynamic_adjustment_summary':
      title = 'Dynamic Adjustment Summary';
      const adjustments = plan.dynamicAdjustmentsApplied || [];
      const warnings = plan.warnings || [];
      if (adjustments.length > 0 || warnings.length > 0) {
        message = `${E_Warn} Dynamic Adjustments Active - ${plan.dayOfWeek}\n\n`;
        if (adjustments.length > 0) {
          message += `Active Modes:\n`;
          adjustments.forEach((a: string) => {
            message += `- ${a.replace(/_/g, ' ')}\n`;
          });
        }
        if (warnings.length > 0) {
          message += `\nWarnings:\n`;
          warnings.forEach((w: string) => {
            message += `- ${w}\n`;
          });
        }
        message += `\n${E_Arrow} Next:\nCheck each protocol block for specific changes.`;
      } else {
        message = `${E_Check} No Dynamic Adjustments Active - ${plan.dayOfWeek}\n\nAll protocols running as planned.`;
      }
      break;

    default:
      throw new Error(`Unknown reminder type: ${type}`);
  }

  // Prepend dynamic warnings if relevant
  if (plan.warnings && plan.warnings.length > 0) {
    if (type === 'gym' || type === 'study1' || type === 'study2' || type === 'study3') {
      const wTxt = plan.warnings.map((w: string) => `- ${w}`).join('\n');
      message = `${E_Warn} DYNAMIC ADJUSTMENT ACTIVE:\n${wTxt}\n\n---\n\n${message}`;
    }
  }

  return {
    type,
    title,
    message,
    sections,
    priority: 'high',
    source: 'routine_protocol_engine',
    date: dateToUse,
    generatedAt: new Date().toISOString()
  };
}
