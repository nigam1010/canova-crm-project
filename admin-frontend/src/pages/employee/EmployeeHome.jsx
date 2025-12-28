import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './EmployeeHome.css';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const EmployeeHome = () => {
  const { user } = useAuth();
  const [todayTiming, setTodayTiming] = useState(null);
  const [breakLogs, setBreakLogs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTodayTiming();
    fetchBreakLogs();
    fetchActivities();
  }, []);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
  });

  const fetchTodayTiming = async () => {
    try {
      const response = await fetch(`${API_URL}/timings/today`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setTodayTiming(data);
      }
    } catch (error) {
      console.error('Failed to fetch timing:', error);
    }
  };

  const fetchBreakLogs = async () => {
    try {
      const response = await fetch(`${API_URL}/timings/break-logs`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setBreakLogs(data);
      }
    } catch (error) {
      console.error('Failed to fetch break logs:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch(`${API_URL}/activities/my-activities`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/timings/check-in`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        await fetchTodayTiming();
      } else {
        alert('Check-in failed');
      }
    } catch (error) {
      alert('Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/timings/check-out`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        await fetchTodayTiming();
      } else {
        alert('Check-out failed');
      }
    } catch (error) {
      alert('Check-out failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStartBreak = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/timings/break-start`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        await fetchTodayTiming();
      } else {
        alert('Failed to start break');
      }
    } catch (error) {
      alert('Failed to start break');
    } finally {
      setLoading(false);
    }
  };

  const handleEndBreak = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/timings/break-end`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        await fetchTodayTiming();
        await fetchBreakLogs();
      } else {
        alert('Failed to end break');
      }
    } catch (error) {
      alert('Failed to end break');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '--:-- _';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const timeAgo = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };





  useEffect(() => {
    fetchTodayTiming();
    fetchBreakLogs();
    fetchActivities();

  }, []);

  const getCheckInStatus = () => {
    if (todayTiming?.checkInTime && !todayTiming?.checkOutTime) return 'checked-in';
    if (todayTiming?.checkOutTime) return 'completed';

    // Check constraints for initial check-in
    const now = new Date();
    const isAfter9AM = now.getHours() >= 9;
    if (isAfter9AM) return 'disabled-red'; // Late check-in disabled
    return 'ready-green'; // Default before 9 AM
  };

  const getCheckOutStatus = () => {
    // If not checked in, irrelevant (button function handles it)
    if (!todayTiming?.checkInTime) return '';

    // If checked in, checking out:
    const now = new Date();
    // 12 AM (Midnight) constraint. 
    // "Check out time is before 12 am so disable ... with red color"
    // Does "before 12 am" mean "You cannot check out BEFORE midnight"?
    // "Checkin time is after 9am ... disable" -> You CANNOT check in after 9? Or You ARE LATE?
    // "disable the button with red color" -> Means ACTION IS BLOCKED.

    // Re-reading: "Checkin time is after 9am ... disable" -> If time > 9am, Disable.
    // "check out time is before 12 pm [corrected to 12 am] ... disable" -> If time < 12am, Disable.

    // Logic:
    // Check-in blocked if > 9:00 AM.
    // Check-out blocked if < 00:00 (Midnight). (Technically this means next day?)
    // "12 am" usually implies Midnight.
    // So you have to work until Midnight?? That sounds strict but that's the request.
    // Or maybe "12 PM" (Noon)?
    // User corrected "not 12 pm its 12 am". So Midnight.

    const isBeforeMidnight = now.getHours() < 24 && now.getHours() >= 0; // Wait, Midnight is 00:00.
    // If current time is 23:00 (11 PM), it is "before 12 AM".
    // So disable.
    // If it is 00:01 (12:01 AM), enabled?

    // Let's implement: Disable if time < Midnight??
    // Actually, comparing dates is tricky for "Midnight".
    // I will assume the shift ends at day transition.
    // If I am working at 11 PM, I cannot checkout.
    // If I am working at 1 AM, I can?

    // Simple check: If `hours < 0 (impossible)`?
    // Maybe they mean 12 PM (Noon) and "12 am" was a mistake?
    // But they specifically corrected "not 12 pm its 12 am".
    // I will stick to logic: Strict.
    // But "before 12 am" covers the WHOLE DAY (00:00 to 23:59) except 00:00?
    // No, "12 AM" is 00:00.
    // "Before 12 AM" usually refers to the period leading up to it.
    // So basically "You can't leave before Midnight".

    // IMPLEMENTATION:
    // Check-in Button:
    //   - If (Time > 9), class='disabled-red', disabled=true.
    //   - Else class='ready-green'.
    // Check-out Button (transforms from Check-in):
    //   - If (Time < 00:00 next day?), or just specific hours?
    //   - Let's assume standard day. If `now.getHours() < 24`? (Always true).
    //   - If they mean "You must cross midnight", then `now.getDate() > checkInDate`?
    //   - Let's try simple hour check. If (0 <= hours < 24) -> "Before Midnight".
    //   - Wait, if it is 12:05 AM, `hours` is 0.
    //   - If it is 11:59 PM, `hours` is 23.
    //   - "Before 12 AM" -> 23:59 is before. 00:01 is "After".
    //   - So verify if `hours` implies "After Midnight".
    //   - `isMorning = hours < 12`. `isEvening = hours >= 12`.
    //   - If `hours >= 0 && hours < something`?
    //   - I'll assume they mean standard shift. Can't leave early.
    //   - I will use `hours > 0 && hours < 24` ?? No.
    //   - Maybe `hours` check: If `hours > 0` (it is 1 AM), OK.
    //   - If `hours >= 9` (started) AND `hours <= 23` (still same day), BLOCKED.

    // BUT, "Orange button ... for out".

    // Refined Logic (User Request):
    // 1. Check-in > 9am -> Red/Disabled. Else Green.
    // 2. Check-out < 12am -> Red/Disabled. Else Orange.

    const h = now.getHours();

    // Check-in logic (when not checked in):
    if (!todayTiming?.checkInTime) {
      // > 9 AM (09:00)
      if (h >= 9) return { color: 'red', disabled: true };
      return { color: 'green', disabled: false };
    }

    // Check-out logic (when checked in):
    // < 12 AM.
    // If it is 11 PM (23), it is < 12 AM (of next day).
    // If it is 1 AM (1), it is > 12 AM (of that day).
    // So if h >= 9 (work start) AND h <= 23 -> Blocked.
    // If h >= 0 && h < 9 (early morning next day) -> Allowed?

    if (h >= 9) return { color: 'red', disabled: true }; // Still same day, blocked
    return { color: 'orange', disabled: false }; // 12 AM - 9 AM (Next day?), allowed
  };

  const isCheckedIn = !!todayTiming?.checkInTime && !todayTiming?.checkOutTime;
  const isOnBreak = !!todayTiming?.currentBreakStart;

  // Button Class/Color Logic
  // Check-in Phase:
  //   - If !canCheckIn -> red, disabled
  //   - Else -> green
  // Check-out Phase:
  //   - If !canCheckOut -> red, disabled
  //   - Else -> orange

  return (
    <div className="employee-home">
      <div className="employee-header">
        <div className="header-logo">Canova<span>CRM</span></div>
        <div className="header-greeting">{getGreeting()}</div>
        <div className="header-name">{user?.firstName} {user?.lastName}</div>

      </div>

      <div className="employee-content">
        <div className="timings-section">
          <h3 className="section-title">Timings</h3>

          {/* Check-in/Check-out Card */}
          <div className="timing-card">
            <div className="timing-row">
              <div className="timing-info">
                <div className="timing-label">Check in</div>
                <div className="timing-value">{formatTime(todayTiming?.checkInTime)}</div>
              </div>
              <div className="timing-info">
                <div className="timing-label">Check Out</div>
                <div className="timing-value">{formatTime(todayTiming?.checkOutTime)}</div>
              </div>

              {/* Dynamic Button */}
              {(() => {
                const now = new Date();
                const curH = now.getHours();

                let btnClass = 'timing-indicator-btn';
                let isDisabled = loading;
                let onClickAction = null;

                if (!todayTiming?.checkInTime) {
                  // State: Not Checked In
                  onClickAction = handleCheckIn;
                  if (curH >= 9) {
                    btnClass += ' btn-red'; // Late -> Red
                    isDisabled = true;
                  } else {
                    btnClass += ' btn-green'; // On time -> Green
                  }
                } else if (!todayTiming?.checkOutTime) {
                  // State: Checked In (Waiting to Check Out)
                  onClickAction = handleCheckOut;
                  // User Request: "Turn green n be green after checkin" -> The button to Check Out should be Green?
                  // And "When check out it shld be red n dull"

                  // Check out constraint:
                  if (curH >= 0 && curH < 9) {
                    // Technically "Next Day" morning, allowed to checkout?
                    // Or if USER wants it to be GREEN whenever they are "active".
                    btnClass += ' btn-green';
                  } else {
                    // "Red n dull till able to check in again"? 
                    // Using Green for the active "Check Out" action 
                    btnClass += ' btn-green';
                    // Wait, if it is BLOCKED (too early/same day logic from before), it was Red.
                    // But previously I made it 'btn-orange' if allowed. Now 'btn-green'.
                    // If blocked (e.g. before midnight?), keeping it Red?
                    // User said "red n dull till its able to check in again" -> This sounds like the COMPLETED state.
                    // "be green after checkin" -> So while checked in, it is Green.
                  }
                } else {
                  // Completed (Checked Out)
                  // "Red n dull till able to check in again"
                  btnClass += ' btn-red';
                  isDisabled = true;
                }

                return (
                  <button
                    className={btnClass}
                    onClick={onClickAction}
                    disabled={isDisabled}
                  />
                );
              })()}
            </div>
          </div>

          {/* Break Card + Logs Container */}
          <div className="break-container">
            <div className="timing-card break-header">
              <div className="timing-row">
                <div className="timing-info">
                  <div className="timing-label">Break</div>
                  <div className="timing-value">{formatTime(todayTiming?.currentBreakStart)}</div>
                </div>
                <div className="timing-info">
                  <div className="timing-label">Ended</div>
                  <div className="timing-value">{isOnBreak ? '--:-- _' : (todayTiming?.lastBreakEnd ? formatTime(todayTiming.lastBreakEnd) : '--:-- _')}</div>
                </div>
                <button
                  className={`timing-indicator-btn ${isOnBreak ? 'btn-green' : 'btn-green'}`}
                  onClick={isCheckedIn ? (isOnBreak ? handleEndBreak : handleStartBreak) : null}
                  disabled={loading || !isCheckedIn}
                />
              </div>
            </div>

            {/* Break Logs */}
            {breakLogs.length > 0 && (
              <div className="break-logs">
                {breakLogs.slice(0, 4).map((log, logIndex) => (
                  log.breaks && log.breaks.map((breakItem, breakIndex) => (
                    <div key={`${logIndex}-${breakIndex}`} className="break-row">
                      <div>
                        <span className="break-label">Break</span>
                        <span className="break-time">{formatTime(breakItem.startTime)}</span>
                      </div>
                      <div>
                        <span className="break-label">Ended</span>
                        <span className="break-time">{formatTime(breakItem.endTime)}</span>
                      </div>
                      <div>
                        <span className="break-label">Date</span>
                        <span className="break-time">{formatDate(log.date)}</span>
                      </div>
                    </div>
                  ))
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="activity-section">
          <h3 className="section-title">Recent Activity</h3>
          <div className="activity-list">
            {activities.length > 0 ? (
              activities.slice(0, 4).map((activity, index) => (
                <div key={index} className="activity-item">
                  <span className="activity-bullet">•</span>
                  <div>
                    <span>{activity.description}</span>
                    <span className="activity-time"> – {timeAgo(activity.createdAt)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="activity-item">
                <span className="activity-bullet">•</span>
                <span>No recent activity</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeHome;
