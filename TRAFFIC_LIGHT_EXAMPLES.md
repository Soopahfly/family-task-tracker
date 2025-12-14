# Traffic Light System Examples

Visual examples of how the traffic light status system works for kids' tasks.

## How Status is Calculated

The system looks at **pending (incomplete) tasks only** for each kid:

```
Pending Tasks = 0  →  🟢 GREEN (All done!)
Pending Tasks = 1-2  →  🟡 YELLOW (Almost there!)
Pending Tasks = 3+  →  🔴 RED (Get to work!)
```

## Real-World Examples

### Example 1: Sarah's Day

**Morning (8 AM):**
- Sarah has 5 tasks: Make bed, Brush teeth, Clean room, Homework, Feed cat
- Status: 🔴 **RED** (5 pending tasks)
- Her light is RED

**After Breakfast (9 AM):**
- ✅ Made bed
- ✅ Brushed teeth
- Remaining: Clean room, Homework, Feed cat
- Status: 🔴 **RED** (still 3 pending tasks)
- Her light is still RED

**Afternoon (2 PM):**
- ✅ Made bed
- ✅ Brushed teeth
- ✅ Cleaned room
- Remaining: Homework, Feed cat
- Status: 🟡 **YELLOW** (2 pending tasks)
- Her light turns YELLOW!

**Evening (5 PM):**
- ✅ Made bed
- ✅ Brushed teeth
- ✅ Cleaned room
- ✅ Finished homework
- Remaining: Feed cat
- Status: 🟡 **YELLOW** (1 pending task)
- Her light stays YELLOW

**Bedtime (7 PM):**
- ✅ All tasks complete!
- Remaining: 0
- Status: 🟢 **GREEN**
- Her light turns GREEN - celebration time!

### Example 2: Twins with Different Progress

**Jake:**
- Total tasks: 4 (Homework, Make bed, Take out trash, Practice piano)
- Completed: Make bed
- Pending: 3
- Status: 🔴 **RED**

**Emma (Jake's twin):**
- Total tasks: 4 (Homework, Make bed, Set table, Practice violin)
- Completed: Make bed, Set table, Homework
- Pending: 1 (Practice violin)
- Status: 🟡 **YELLOW**

Walking past their rooms, parents can instantly see:
- Jake's light: 🔴 RED (needs encouragement!)
- Emma's light: 🟡 YELLOW (almost done!)

### Example 3: Weekend vs. Weekday

**Monday (Weekday) - Tommy:**
- 7 tasks assigned
- 2 completed
- 5 pending
- Status: 🔴 **RED** (lots to do!)

**Saturday (Weekend) - Tommy:**
- 2 tasks assigned (Clean room, Help with groceries)
- 0 completed
- 2 pending
- Status: 🟡 **YELLOW** (fewer weekend tasks)

## Customizing Thresholds

Want to change when lights turn yellow vs red? Edit `src/integrations.js`:

```javascript
export function calculateTrafficLightStatus(kid, tasks) {
  const kidTasks = tasks.filter(t => t.kidId === kid.id && !t.completed)

  if (kidTasks.length === 0) {
    return 'green'  // All done
  } else if (kidTasks.length <= 2) {  // ← CHANGE THIS NUMBER
    return 'yellow'  // Few tasks left
  } else {
    return 'red'  // Many tasks pending
  }
}
```

### Custom Threshold Examples:

**Stricter (motivated kids):**
```javascript
} else if (kidTasks.length <= 1) {  // Only 1 task = yellow
  return 'yellow'
```
Result: 🟢 0 tasks, 🟡 1 task, 🔴 2+ tasks

**More Lenient (younger kids):**
```javascript
} else if (kidTasks.length <= 3) {  // Up to 3 tasks = yellow
  return 'yellow'
```
Result: 🟢 0 tasks, 🟡 1-3 tasks, 🔴 4+ tasks

**Percentage-Based:**
```javascript
export function calculateTrafficLightStatus(kid, tasks) {
  const kidTasks = tasks.filter(t => t.kidId === kid.id)
  const completed = kidTasks.filter(t => t.completed).length
  const total = kidTasks.length

  if (total === 0) return 'green'

  const percentComplete = (completed / total) * 100

  if (percentComplete === 100) {
    return 'green'  // 100% done
  } else if (percentComplete >= 50) {
    return 'yellow'  // 50% or more done
  } else {
    return 'red'  // Less than 50% done
  }
}
```

## Advanced: Time-Based Colors

Want lights to turn more urgent as bedtime approaches?

```javascript
export function calculateTrafficLightStatus(kid, tasks) {
  const kidTasks = tasks.filter(t => t.kidId === kid.id && !t.completed)
  const hour = new Date().getHours()
  const isEvening = hour >= 18  // After 6 PM

  if (kidTasks.length === 0) {
    return 'green'
  } else if (isEvening && kidTasks.length > 0) {
    return 'red'  // Any pending tasks in evening = RED!
  } else if (kidTasks.length <= 2) {
    return 'yellow'
  } else {
    return 'red'
  }
}
```

## Visual Placement Ideas

### Option 1: Bedroom Door Frame
LED strip around the door - visible from hallway as you walk by. Parents can check everyone's status at a glance!

### Option 2: Desk Lamp
Small LED strip under each kid's desk. They see their status while working.

### Option 3: Bedside Night Light
Hue bulb or WLED in bedside lamp. Doubles as nightlight and status indicator.

### Option 4: Family Command Center
Large display in kitchen/common area showing all kids' statuses side-by-side:
```
[Sarah: 🟢] [Jake: 🔴] [Emma: 🟡]
```

## Fun Additions

**Victory Flash:**
When a kid completes their last task (goes from YELLOW to GREEN), make the light flash or pulse green!

**Morning Reset:**
Set lights to a neutral color (white/blue) until first task is assigned each day.

**Points Display:**
Use LED strips with multiple segments - first segment shows task status, second segment shows points level (dim to bright).

**Parent Alert:**
If any light is still RED at bedtime (8 PM), send a notification or flash the light.

## Testing Without Hardware

Want to test without actual lights? Add this to `src/integrations.js`:

```javascript
export async function updateHomeAssistantLight(haUrl, haToken, entityId, color) {
  console.log(`🔆 HA Light Update: ${entityId} → RGB(${color.r}, ${color.g}, ${color.b})`)
  alert(`Light would turn ${color.r === 0 ? 'GREEN' : color.r === 255 && color.g === 255 ? 'YELLOW' : 'RED'}!`)
  return Promise.resolve({ success: true })
}

export async function updateWLEDLight(wledUrl, color, segment = 0) {
  console.log(`🔆 WLED Update: ${wledUrl} → RGB(${color.r}, ${color.g}, ${color.b})`)
  alert(`WLED would turn ${color.r === 0 ? 'GREEN' : color.r === 255 && color.g === 255 ? 'YELLOW' : 'RED'}!`)
  return Promise.resolve({ success: true })
}
```

Now when tasks change, you'll see alerts showing what color the lights would be!
