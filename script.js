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
const shareImageWidth = 1200;
const shareImageHeight = 1500;

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
let latestCountdownParts = null;
let latestProgressLabel = "0.00%";

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
  return `GTA VI launches on November 19, 2026. Time left: ${parts.years} year(s), ${parts.months} month(s), ${parts.days} day(s), ${pad(parts.hours)}h ${pad(parts.minutes)}m ${pad(parts.seconds)}s.`;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("Failed to export image."));
    }, "image/png");
  });
}

function drawRoundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function drawCoverImage(context, image, x, y, width, height) {
  const imageRatio = image.width / image.height;
  const frameRatio = width / height;

  let drawWidth = width;
  let drawHeight = height;
  let offsetX = x;
  let offsetY = y;

  if (imageRatio > frameRatio) {
    drawHeight = height;
    drawWidth = height * imageRatio;
    offsetX = x - (drawWidth - width) / 2;
  } else {
    drawWidth = width;
    drawHeight = width / imageRatio;
    offsetY = y - (drawHeight - height) / 2;
  }

  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function drawTimeCard(context, x, y, width, height, value, label, accent = false) {
  const fill = accent
    ? "rgba(255, 138, 78, 0.18)"
    : "rgba(255, 255, 255, 0.08)";
  const stroke = accent
    ? "rgba(255, 180, 120, 0.3)"
    : "rgba(255, 255, 255, 0.12)";

  context.save();
  drawRoundedRect(context, x, y, width, height, 28);
  context.fillStyle = fill;
  context.strokeStyle = stroke;
  context.lineWidth = 2;
  context.fill();
  context.stroke();

  context.fillStyle = "#fff5fb";
  context.font = "700 60px ViceDisplay, ViceSans, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(value, x + width / 2, y + height / 2 - 18);

  context.fillStyle = "rgba(255, 245, 251, 0.72)";
  context.font = "600 22px ViceSans, sans-serif";
  context.fillText(label.toUpperCase(), x + width / 2, y + height - 38);
  context.restore();
}

async function createShareImage() {
  if (!latestCountdownParts) {
    throw new Error("Countdown data is not ready.");
  }

  const [background, logo] = await Promise.all([
    loadImage("./background.jpeg"),
    loadImage("./logo.png"),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = shareImageWidth;
  canvas.height = shareImageHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not available.");
  }

  drawCoverImage(context, background, 0, 0, canvas.width, canvas.height);

  const overlay = context.createLinearGradient(0, 0, 0, canvas.height);
  overlay.addColorStop(0, "rgba(14, 7, 14, 0.22)");
  overlay.addColorStop(0.55, "rgba(18, 8, 17, 0.5)");
  overlay.addColorStop(1, "rgba(11, 5, 12, 0.8)");
  context.fillStyle = overlay;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const glow = context.createRadialGradient(950, 240, 60, 950, 240, 420);
  glow.addColorStop(0, "rgba(255, 127, 96, 0.28)");
  glow.addColorStop(1, "rgba(255, 127, 96, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.save();
  context.globalAlpha = 0.98;
  context.drawImage(logo, canvas.width / 2 - 170, 118, 340, 240);
  context.restore();

  context.fillStyle = "rgba(255, 245, 251, 0.7)";
  context.font = "700 30px ViceSans, sans-serif";
  context.textAlign = "center";
  context.fillText("NOVEMBER 19, 2026", canvas.width / 2, 382);

  context.fillStyle = "#fff5fb";
  context.font = "700 52px ViceDisplay, ViceSans, sans-serif";
  context.fillText("TIME LEFT", canvas.width / 2, 500);

  const progressX = 130;
  const progressY = 574;
  const progressWidth = canvas.width - progressX * 2;
  const progressHeight = 28;
  const fillWidth = progressWidth * (parseFloat(latestProgressLabel) / 100);

  drawRoundedRect(context, progressX, progressY, progressWidth, progressHeight, 999);
  context.fillStyle = "rgba(16, 7, 14, 0.58)";
  context.fill();
  context.strokeStyle = "rgba(255, 196, 142, 0.25)";
  context.lineWidth = 2;
  context.stroke();

  if (fillWidth > 0) {
    const barGradient = context.createLinearGradient(progressX, progressY, progressX + progressWidth, progressY);
    barGradient.addColorStop(0, "#ffd36f");
    barGradient.addColorStop(0.35, "#ffb15f");
    barGradient.addColorStop(0.7, "#ff8f46");
    barGradient.addColorStop(1, "#ff4fb5");

    drawRoundedRect(context, progressX, progressY, fillWidth, progressHeight, 999);
    context.fillStyle = barGradient;
    context.fill();
  }

  context.fillStyle = "#fff5fb";
  context.font = "700 28px ViceSans, sans-serif";
  context.textAlign = "right";
  context.fillText(latestProgressLabel, progressX + progressWidth, 548);

  const gridX = 86;
  const gridY = 668;
  const cardWidth = 140;
  const cardHeight = 170;
  const gap = 18;
  const values = [
    [pad(latestCountdownParts.years), "Years"],
    [pad(latestCountdownParts.months), "Months"],
    [pad(latestCountdownParts.days), "Days"],
    [pad(latestCountdownParts.hours), "Hours"],
    [pad(latestCountdownParts.minutes), "Minutes"],
    [pad(latestCountdownParts.seconds), "Seconds"],
    [pad(latestCountdownParts.milliseconds, 3), "Millis", true],
  ];

  values.forEach(([value, label, accent], index) => {
    drawTimeCard(
      context,
      gridX + index * (cardWidth + gap),
      gridY,
      cardWidth,
      cardHeight,
      value,
      label,
      Boolean(accent),
    );
  });

  context.fillStyle = "rgba(255, 245, 251, 0.9)";
  context.font = "700 40px ViceDisplay, ViceSans, sans-serif";
  context.textAlign = "center";
  context.fillText("silver472 day", canvas.width / 2, 967);

  context.fillStyle = "rgba(255, 245, 251, 0.74)";
  context.font = "600 28px ViceSans, sans-serif";
  context.fillText(
    "Share this countdown before the launch hits.",
    canvas.width / 2,
    1022,
  );

  context.fillStyle = "rgba(255, 245, 251, 0.66)";
  context.font = "600 22px ViceSans, sans-serif";
  context.fillText(window.location.href, canvas.width / 2, 1360);

  return canvasToBlob(canvas);
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
  let imageFile = null;

  try {
    const imageBlob = await createShareImage();
    imageFile = new File([imageBlob], "gta-vi-countdown.png", {
      type: "image/png",
    });
  } catch (error) {
    imageFile = null;
  }

  if (imageFile && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
    shareData.files = [imageFile];
  }

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

  if (imageFile) {
    const imageUrl = URL.createObjectURL(imageFile);
    const downloadLink = document.createElement("a");
    downloadLink.href = imageUrl;
    downloadLink.download = imageFile.name;
    downloadLink.click();
    URL.revokeObjectURL(imageUrl);
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

  latestCountdownParts = parts;
  latestProgressLabel = progressLabel;
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
