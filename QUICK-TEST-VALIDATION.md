# Quick Test Guide - Validation Integration

## 🚀 Quick Start Testing

Follow these steps to verify the validation improvements are working correctly in the app.

---

## 📋 Test 1: Create Task with Invalid Data

### Test Case 1.1: Invalid Task Name
1. Open http://localhost:8000 (or your dev server)
2. Go to "Tareas" tab
3. Try creating a task with:
   - **Name:** "Hi" (only 2 characters)
   - **Duration:** 60
   - **Priority:** Media
4. **Expected Result:** ❌ Error: "El nombre de la tarea debe tener al menos 3 caracteres"
5. **Verification:** Name field should be focused automatically

### Test Case 1.2: Invalid Duration
1. In the same form, try:
   - **Name:** "Test Task"
   - **Duration:** 10 (less than 15 minutes minimum)
   - **Priority:** Media
2. **Expected Result:** ❌ Error: "La duración debe estar entre 15 minutos (0.25h) y 1440 minutos (24h)"
3. **Verification:** Duration field should be focused automatically

### Test Case 1.3: Valid Task Creation
1. Create with valid data:
   - **Name:** "Test Task"
   - **Duration:** 60
   - **Priority:** Media
   - **Location:** (optional)
2. **Expected Result:**
   - ✅ Success: "Tarea añadida correctamente"
   - Task appears in list
   - Task appears in calendar

---

## 📅 Test 2: Update Task from Calendar Modal

### Test Case 2.1: Edit Task Name
1. Click on any task in the calendar to open modal
2. Change the name to something shorter than 3 characters
3. Try to save
4. **Expected Result:** ❌ Error: "El nombre de la tarea debe tener al menos 3 caracteres"

### Test Case 2.2: Edit Duration
1. Open task modal
2. Change duration to 2000 (more than 1440 max)
3. Try to save
4. **Expected Result:** ❌ Error: "La duración debe estar entre 15 minutos (0.25h) y 1440 minutos (24h)"

### Test Case 2.3: Test "Tarea Fija" Checkbox
1. Open task modal (you should see "📌 Tarea fija" checkbox)
2. Check the "Tarea fija" checkbox
3. Save the task
4. **Expected Result:**
   - ✅ Success message
   - Task is marked as fixed (won't be moved during optimization)
   - Checkbox state persists when reopened

### Test Case 2.4: Valid Update
1. Open task modal
2. Change:
   - Name to "Updated Task"
   - Duration to 120
   - Date/Time to a different slot
3. Save
4. **Expected Result:**
   - ✅ Success: "Tarea 'Updated Task' actualizada correctamente"
   - Calendar refreshes immediately
   - Task list updates

---

## 🗑️ Test 3: Delete Operations

### Test Case 3.1: Delete from List
1. Click delete button on a task in the list
2. **Expected Result:** ❌ Confirmation dialog: "¿Estás seguro de que quieres eliminar esta tarea?"
3. Confirm deletion
4. **Expected Result:**
   - ✅ Success: "Tarea '[name]' eliminada correctamente"
   - Task disappears from list and calendar

### Test Case 3.2: Delete from Modal
1. Open task modal
2. Click "Eliminar" button
3. **Expected Result:** Confirmation dialog
4. Confirm
5. **Expected Result:**
   - ✅ Success notification
   - Modal closes
   - Task removed from calendar

---

## 🔄 Test 4: Drag and Drop Calendar

### Test Case 4.1: Valid Drag
1. Drag a task to a different time slot in the calendar
2. **Expected Result:**
   - ✅ Success: "Tarea '[name]' movida a [date] [time]"
   - Duration recalculated based on slot size
   - Calendar refreshes

### Test Case 4.2: Fixed Task Cannot Move (if isFixed=true)
1. Create a task and mark it as "Tarea fija" in the modal
2. Try to drag it in the calendar
3. **Expected Result:** Task doesn't move (or shows message that fixed tasks can't be moved)

---

## 📱 Test 5: Data Persistence

### Test Case 5.1: Reload After Create
1. Create a new task
2. Refresh the page (F5 or Cmd+R)
3. **Expected Result:**
   - ✅ Task still appears in list
   - ✅ Task still appears in calendar
   - All properties preserved (name, duration, priority, isFixed)

### Test Case 5.2: Reload After Edit
1. Edit a task (change name, duration, etc.)
2. Refresh the page
3. **Expected Result:**
   - ✅ Changes are preserved
   - ✅ All properties correct

### Test Case 5.3: Check localStorage
1. Open DevTools (F12)
2. Go to "Application" tab
3. Go to "Local Storage"
4. Look for "calendarApp" key
5. **Expected Result:**
   - ✅ JSON contains all tasks
   - ✅ Each task has correct properties (id, name, duration, priority, isFixed, etc.)

---

## 🔍 Test 6: Error Handling

### Test Case 6.1: Browser Console
1. Open DevTools (F12)
2. Go to "Console" tab
3. Perform all the above tests
4. **Expected Result:**
   - ✅ No red error messages
   - ✅ Validation logs appear as expected
   - ✅ Error stack traces for debugging if something fails

### Test Case 6.2: Network Issues (Optional)
1. In DevTools Network tab, set throttling to "Offline"
2. Try creating a task
3. **Expected Result:**
   - ✅ Task still saves to localStorage
   - ✅ Proper error handling if external API calls fail (geocoding)

---

## ✅ Verification Checklist

| Test | Status | Notes |
|------|--------|-------|
| Invalid name error | ✅/❌ | Should show: "El nombre debe tener al menos 3 caracteres" |
| Invalid duration error | ✅/❌ | Should show: "La duración debe estar entre 15 y 1440 minutos" |
| Invalid priority error | ✅/❌ | Should show: "La prioridad no es válida" |
| Valid task creation | ✅/❌ | Should show ✅ success message |
| Modal editing works | ✅/❌ | Name, duration, date/time all update |
| "Tarea fija" checkbox works | ✅/❌ | Checkbox appears in modal only |
| Delete confirmation | ✅/❌ | Shows dialog before deletion |
| Delete success message | ✅/❌ | Shows task name in message |
| Drag task to new time | ✅/❌ | Duration recalculates |
| Data persists on reload | ✅/❌ | Tasks still there after F5 |
| localStorage has tasks | ✅/❌ | DevTools > Application > Local Storage |
| No console errors | ✅/❌ | DevTools > Console (no red messages) |

---

## 🎯 Success Criteria

The validation integration is working correctly when:

1. ✅ All invalid input attempts show appropriate error messages
2. ✅ Valid inputs create/update/delete tasks successfully
3. ✅ Error messages include emoji icons (❌ or ✅)
4. ✅ Invalid fields are auto-focused for correction
5. ✅ Task data persists across page reloads
6. ✅ "Tarea fija" checkbox only appears in calendar modal
7. ✅ Browser console has no red error messages
8. ✅ localStorage contains correct task data

---

## 🐛 Troubleshooting

### Issue: Validation messages don't appear
- **Check:** Is `showNotification()` function defined?
- **Fix:** Verify showNotification() is in app.js and working

### Issue: Field doesn't auto-focus
- **Check:** Is the DOM element ID correct?
- **Fix:** Verify `document.getElementById()` matches your HTML form

### Issue: "Tarea fija" checkbox doesn't appear in modal
- **Check:** Was the HTML updated in index.html?
- **Fix:** Make sure line 647-655 has modalTaskIsFixed element added

### Issue: Tasks disappear after reload
- **Check:** Is localStorage enabled in browser?
- **Fix:** Check browser settings, privacy mode might disable localStorage

### Issue: Drag and drop doesn't update time
- **Check:** Is updateTaskDateTime() being called?
- **Fix:** Verify FullCalendar eventDrop callback is properly wired

---

## 📝 Test Results Template

```markdown
## Test Results - [Date]

### Overall Status: ✅ PASS / ❌ FAIL

### Test 1: Create Task Validation
- [ ] Invalid name: ✅/❌
- [ ] Invalid duration: ✅/❌
- [ ] Valid creation: ✅/❌

### Test 2: Edit Task
- [ ] Name validation: ✅/❌
- [ ] Duration validation: ✅/❌
- [ ] "Tarea fija" works: ✅/❌

### Test 3: Delete
- [ ] Confirmation dialog: ✅/❌
- [ ] Success message: ✅/❌

### Test 4: Drag & Drop
- [ ] Valid drag: ✅/❌

### Test 5: Data Persistence
- [ ] Tasks persist: ✅/❌
- [ ] localStorage correct: ✅/❌

### Test 6: Console
- [ ] No red errors: ✅/❌

### Notes:
[Any issues or observations]
```

---

## 🚀 Ready to Test?

1. Make sure the development server is running
2. Open http://localhost:8000 in your browser
3. Follow the test cases above
4. Report any issues in the console

Good luck! The validation should now provide much better error feedback and data integrity. 🎉
