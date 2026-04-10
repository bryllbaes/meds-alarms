let alarms = [];
let selectedHours = 8;
let selectedMinutes = 0;
let selectedSeconds = 0;

const STORAGE_KEY = 'medicineAlarms';

function initializeTimePickers() {
  initializePicker('hoursPicker', 24, selectedHours);
  initializePicker('minutesPicker', 60, selectedMinutes);
  initializePicker('secondsPicker', 60, selectedSeconds);
}

function initializePicker(pickerId, max, selected) {
  const picker = document.getElementById(pickerId);
  picker.innerHTML = '';
  
  for (let i = 0; i < max; i++) {
    const option = document.createElement('div');
    option.className = 'scroll-option' + (i === selected ? ' selected' : '');
    option.textContent = i.toString().padStart(2, '0');
    option.onclick = () => selectOption(pickerId, i);
    picker.appendChild(option);
  }
  
  // Scroll to selected
  const options = picker.querySelectorAll('.scroll-option');
  if (options[selected]) {
    setTimeout(() => {
      options[selected].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  }
}

function selectOption(pickerId, value) {
  if (pickerId === 'hoursPicker') selectedHours = value;
  else if (pickerId === 'minutesPicker') selectedMinutes = value;
  else if (pickerId === 'secondsPicker') selectedSeconds = value;
  
  initializePicker(pickerId, pickerId === 'hoursPicker' ? 24 : 60, value);
}

function saveAlarmsToStorage() {
  const alarmsToSave = alarms.map(alarm => ({
    id: alarm.id,
    label: alarm.label,
    hours: alarm.hours,
    minutes: alarm.minutes,
    seconds: alarm.seconds,
    status: alarm.status
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alarmsToSave));
}

function loadAlarmsFromStorage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const alarmsData = JSON.parse(stored);
    alarms = alarmsData.map(alarm => {
      const newAlarm = {
        id: alarm.id,
        label: alarm.label,
        hours: alarm.hours,
        minutes: alarm.minutes,
        seconds: alarm.seconds,
        status: alarm.status
      };
      scheduleNextAlarm(newAlarm);
      return newAlarm;
    });
  } else {
    // Load default alarms if none stored
    loadDefaultAlarms();
  }
  
  displayAlarms();
}

function loadDefaultAlarms() {
  const defaults = [
    { label: 'Morning Medicine', hours: 8, minutes: 0, seconds: 0 },
    { label: 'Afternoon Medicine', hours: 14, minutes: 0, seconds: 0 },
    { label: 'Evening Medicine', hours: 20, minutes: 0, seconds: 0 }
  ];
  
  alarms = defaults.map((def, index) => {
    const alarm = {
      id: Date.now() + index,
      label: def.label,
      hours: def.hours,
      minutes: def.minutes,
      seconds: def.seconds,
      status: 'Active'
    };
    scheduleNextAlarm(alarm);
    return alarm;
  });
  
  saveAlarmsToStorage();
}

function scheduleNextAlarm(alarm) {
  const now = new Date();
  const alarmTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), alarm.hours, alarm.minutes, alarm.seconds);
  
  if (alarmTime <= now) {
    alarmTime.setDate(alarmTime.getDate() + 1); // Next day
  }
  
  const timeout = setTimeout(() => {
    playAlarmSound();
    alert(`🔔 ${alarm.label} - Time's up!`);
    scheduleNextAlarm(alarm); // Reschedule for next day
  }, alarmTime - now);
  
  alarm.timeout = timeout;
  alarm.nextTrigger = alarmTime;
}

function playAlarmSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 1000;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
  } catch (e) {
    console.log('Audio error:', e);
  }
}

function setAlarm() {
  const label = document.getElementById('alarmLabel').value || 'Alarm';
  
  const alarmId = Date.now();
  
  const alarm = {
    id: alarmId,
    label: label,
    hours: selectedHours,
    minutes: selectedMinutes,
    seconds: selectedSeconds,
    status: 'Active'
  };
  
  scheduleNextAlarm(alarm);
  alarms.push(alarm);
  
  // Save to storage
  saveAlarmsToStorage();
  
  // Update UI
  displayAlarms();
  
  // Reset form
  document.getElementById('alarmLabel').value = '';
  selectedHours = 8;
  selectedMinutes = 0;
  selectedSeconds = 0;
  initializeTimePickers();
  
  console.log('Daily alarm saved:', alarms);
}

function cancelAlarm(alarmId) {
  const alarm = alarms.find(a => a.id === alarmId);
  if (alarm) {
    clearTimeout(alarm.timeout);
    removeAlarm(alarmId);
    saveAlarmsToStorage();
    displayAlarms();
  }
}

function removeAlarm(alarmId) {
  alarms = alarms.filter(a => a.id !== alarmId);
}

function displayAlarms() {
  const alarmList = document.getElementById('alarmList');
  
  if (alarms.length === 0) {
    alarmList.innerHTML = '<div class="no-alarms">No alarms set</div>';
    return;
  }
  
  alarmList.innerHTML = alarms.map(alarm => `
    <div class="alarm-item">
      <div class="alarm-info">
        <div class="alarm-time">${alarm.hours.toString().padStart(2, '0')}:${alarm.minutes.toString().padStart(2, '0')}:${alarm.seconds.toString().padStart(2, '0')}</div>
        <div class="alarm-label">${alarm.label}</div>
        <div class="alarm-status">Daily - Next: ${alarm.nextTrigger.toLocaleTimeString()}</div>
      </div>
      <button class="delete-btn" onclick="cancelAlarm(${alarm.id})">Delete</button>
    </div>
  `).join('');
}

// Initialize on page load
window.onload = () => {
  loadAlarmsFromStorage();
  initializeTimePickers();
};