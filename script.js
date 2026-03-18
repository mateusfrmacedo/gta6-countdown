const launchDate = new Date("2026-11-19T00:00:00-03:00");
const countdownStart = new Date("2026-03-18T00:00:00-03:00");
const timeUnits = {
  day: 24 * 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  minute: 60 * 1000,
  second: 1000,
};
const shareResetDelay = 1600;
const shareErrorDelay = 1800;
const emojiCleanupDelay = 1300;
const emojiCooldownDelay = 700;

const units = {
  years: document.getElementById("years"),
  months: document.getElementById("months"),
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds"),
  milliseconds: document.getElementById("milliseconds"),
};

const progressFill = document.getElementById("progressFill");
const progressTrack = document.querySelector(".progress-track");
const progressValue = document.getElementById("progressValue");
const progressCelebration = document.getElementById("progressCelebration");
const emojiBurst = document.getElementById("emojiBurst");
const shareButton = document.getElementById("shareButton");
const root = document.documentElement;

let latestShareText =
  "GTA VI is getting closer. Share the countdown.";
let pointerTargetX = 0;
let pointerTargetY = 0;
let pointerCurrentX = 0;
let pointerCurrentY = 0;
let burstCooldown = false;

function pad(value, size = 2) {
  return String(value).padStart(size, "0");
}

function addYears(date, amount) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + amount);
  return next;
}

function addMonths(date, amount) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

function diffCalendarParts(start, end) {
  let cursor = new Date(start);
  let years = 0;
  let months = 0;

  while (addYears(cursor, 1) <= end) {
    cursor = addYears(cursor, 1);
    years += 1;
  }

  while (addMonths(cursor, 1) <= end) {
    cursor = addMonths(cursor, 1);
    months += 1;
  }

  const remainingMs = Math.max(0, end - cursor);
  const days = Math.floor(remainingMs / timeUnits.day);
  const hours = Math.floor((remainingMs % timeUnits.day) / timeUnits.hour);
  const minutes = Math.floor((remainingMs % timeUnits.hour) / timeUnits.minute);
  const seconds = Math.floor((remainingMs % timeUnits.minute) / timeUnits.second);
  const milliseconds = Math.floor(remainingMs % timeUnits.second);

  return { years, months, days, hours, minutes, seconds, milliseconds };
}

function buildShareText(parts) {
  return `${parts.years} year(s), ${parts.months} month(s), ${parts.days} day(s), ${pad(parts.hours)}h ${pad(parts.minutes)}m ${pad(parts.seconds)}s left until GTA VI on 11/19/2026.`;
}

function launchEmojiBurst() {
  if (!emojiBurst || burstCooldown) {
    return;
  }

  burstCooldown = true;
  const emojis = ["🎉", "🎊", "✨", "🥳", "🎆"];

  for (let index = 0; index < 8; index += 1) {
    const piece = document.createElement("span");
    piece.className = "emoji-pop";
    piece.textContent = emojis[index % emojis.length];
    piece.style.setProperty("--emoji-x", `${Math.round((Math.random() - 0.5) * 92)}px`);
    piece.style.setProperty("--emoji-y", `${Math.round(Math.random() * -22)}px`);
    piece.style.setProperty("--emoji-rotate", `${Math.round((Math.random() - 0.5) * 70)}deg`);
    piece.style.animationDelay = `${index * 45}ms`;
    emojiBurst.appendChild(piece);
    window.setTimeout(() => {
      piece.remove();
    }, emojiCleanupDelay);
  }

  window.setTimeout(() => {
    burstCooldown = false;
  }, emojiCooldownDelay);
}

function updateParallax() {
  pointerCurrentX += (pointerTargetX - pointerCurrentX) * 0.08;
  pointerCurrentY += (pointerTargetY - pointerCurrentY) * 0.08;

  root.style.setProperty("--bg-shift-x", `${pointerCurrentX}px`);
  root.style.setProperty("--bg-shift-y", `${pointerCurrentY}px`);

  window.requestAnimationFrame(updateParallax);
}

async function handleShare() {
  const shareData = {
    title: "GTA VI Countdown",
    text: latestShareText,
    url: window.location.href,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if (error && error.name === "AbortError") {
        return;
      }
    }
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(`${latestShareText} ${window.location.href}`);
    shareButton.classList.add("is-copied");
    window.setTimeout(() => {
      shareButton.classList.remove("is-copied");
    }, shareResetDelay);
  }
}

function updateCountdown() {
  const now = new Date();
  const safeNow = now > launchDate ? launchDate : now;
  const remainingMs = Math.max(0, launchDate - now);
  const parts = diffCalendarParts(safeNow, launchDate);

  units.years.textContent = pad(parts.years);
  units.months.textContent = pad(parts.months);
  units.days.textContent = pad(parts.days);
  units.hours.textContent = pad(parts.hours);
  units.minutes.textContent = pad(parts.minutes);
  units.seconds.textContent = pad(parts.seconds);
  units.milliseconds.textContent = pad(parts.milliseconds, 3);

  const totalWindow = launchDate - countdownStart;
  const elapsed = Math.min(Math.max(now - countdownStart, 0), totalWindow);
  const progress = totalWindow <= 0 ? 100 : (elapsed / totalWindow) * 100;
  const progressLabel = `${progress.toFixed(2)}%`;

  progressFill.style.width = progressLabel;
  progressValue.textContent = progressLabel;
  progressTrack.setAttribute("aria-valuenow", progress.toFixed(2));

  const shareText =
    remainingMs > 0
      ? buildShareText(parts)
      : "GTA VI is here. The countdown ended on 11/19/2026.";

  latestShareText = shareText;

  if (remainingMs > 0) {
    window.requestAnimationFrame(updateCountdown);
  }
}

shareButton.addEventListener("click", () => {
  handleShare().catch(() => {
    shareButton.classList.add("has-error");
    window.setTimeout(() => {
      shareButton.classList.remove("has-error");
    }, shareErrorDelay);
  });
});

window.addEventListener("mousemove", (event) => {
  const offsetX = event.clientX / window.innerWidth - 0.5;
  const offsetY = event.clientY / window.innerHeight - 0.5;

  pointerTargetX = offsetX * -28;
  pointerTargetY = offsetY * -18;
});

window.addEventListener("mouseleave", () => {
  pointerTargetX = 0;
  pointerTargetY = 0;
});

if (progressCelebration) {
  progressCelebration.addEventListener("mouseenter", launchEmojiBurst);
  progressCelebration.addEventListener("mousemove", launchEmojiBurst);
}

updateParallax();
updateCountdown();
