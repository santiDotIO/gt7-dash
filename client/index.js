const lightUpShiftPoints = (rpm, revLimit, earlyLights, optimalLights, limitLights) => {
  const numLights = earlyLights + optimalLights + limitLights;
  // Handle invalid input (negative values, lights exceeding total)
  if (rpm < 0 || revLimit < 0 || numLights <= 0) {
    console.error("Invalid input: Values must be non-negative numbers and lights cannot be zero.");
    return;
  }

  // Static percentages (adjust these based on your car)
  const earlyShiftPercent = 0.85; // 85% of rev limit for early shift (green line)
  const optimalShiftPercent = 0.95; // 90% of rev limit for optimal shift (red line)

  const earlyShiftPoint = revLimit * earlyShiftPercent;
  const optimalShiftPoint = revLimit * optimalShiftPercent;

  const earlyShftRange = optimalShiftPoint - earlyShiftPoint;
  const optimalShiftRange = revLimit -optimalShiftPoint;
  if (rpm <= earlyShiftPoint) {
    return 0;
  } else if (rpm >= earlyShiftPoint && rpm < optimalShiftPoint) {
    return Math.round((rpm - earlyShiftPoint) / earlyShftRange * earlyLights);
  } else if (rpm >= optimalShiftPoint && rpm < revLimit) {
    return Math.round((rpm - optimalShiftPoint) / optimalShiftRange * optimalLights) + earlyLights;
  } else {
    return numLights;
  }
}

const calculateTyreTemp = (tempNum) => {
  // https://www.yourdatadriven.com/what-should-the-temperature-of-your-racing-car-tyres-be/
  if (tempNum < 60) {
    return "blue"; // Low grip, low degradation - Blue
  } else if (tempNum >= 60 && tempNum <= 75) {
    return "green"; // Medium grip, low degradation - Green
  } else if (tempNum >= 75 && tempNum <= 90) {
    return "yellow"; // High grip, medium degradation - Yellow
  } else if (tempNum >= 90 && tempNum <= 95) {
    return "orange"; // Very high grip, high degradation - Orange
  } else {
    return "red"; // Medium grip, very high degradation - Red
  }
}

const timeFormat = (t = 0) => {
  if (t <= 0) return `00'00:00`;

  const ms = `${t % 1000}`.padStart(3, "0");
  const ss = `${Math.floor(t / 1000) % 60}`.padStart(2, "0");
  const mm = `${Math.floor(t / 1000 / 60)}`;

  return `${mm}:${ss}.${ms}`;
};

const updateClock = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // Format hours to 12-hour format with leading zero
  let formattedHours = hours % 12 === 0 ? 12 : hours % 12;
  formattedHours = formattedHours.toString().padStart(2, '0');

  // Format minutes with leading zero
  const formattedMinutes = minutes.toString().padStart(2, '0');

  // Add meridian indicator (AM/PM)
  const meridian = hours < 12 ? 'am' : 'pm';

  // Combine formatted time and meridian
  const formattedTime = `${formattedHours}:${formattedMinutes}${meridian}`;
  document.querySelector(".clock .value").innerText = formattedTime;
}

const gearFormat = (g) => {
  if (typeof g === 'undefined' || g === -1) return "N";
  else if (g === 0) return "R";
  else return g;
};

const totalLapCountFormat = (l) => {
  if (typeof l === 'undefined') return "";
  else if (l === 0) return "\u221E"; // Infinity
  else return l;
};

const updateDashboard = (event) => {
  const data = JSON.parse(event.data);
  
  document.querySelector("#rpm").innerText = Math.round(data.engineRPM)
  document.querySelector("#fuel").innerText = Math.round(data.gasLevel)
  
  // tyre temp
  const fl = document.querySelector("#fl")
  fl.innerText = `${Math.round(data.tireSurfaceTemperature.FrontLeft)}c`
  fl.setAttribute('data-color', calculateTyreTemp(data.tireSurfaceTemperature.FrontLeft))
  
  const fr = document.querySelector("#fr")
  fr.innerText = `${Math.round(data.tireSurfaceTemperature.FrontRight)}c`
  fr.setAttribute('data-color', calculateTyreTemp(data.tireSurfaceTemperature.FrontRight))
  
  const rl = document.querySelector("#rl")
  rl.innerText = `${Math.round(data.tireSurfaceTemperature.RearLeft)}c`
  rl.setAttribute('data-color', calculateTyreTemp(data.tireSurfaceTemperature.RearLeft))

  const rr = document.querySelector("#rr")
  rr.innerText = `${Math.round(data.tireSurfaceTemperature.RearRight)}c`
  rr.setAttribute('data-color', calculateTyreTemp(data.tireSurfaceTemperature.RearRight))
  
  document.querySelector(".laps .current").innerText = data.lapCount
  document.querySelector(".laps .total").innerText = totalLapCountFormat(data.lapsInRace)
  
  document.querySelector(".best-lap .value").innerText = timeFormat(data.bestLapTime)
  document.querySelector(".last-lap .value").innerText = timeFormat(data.lastLapTime)

  document.querySelector(".current-gear").innerText = gearFormat(data.currentGear)
  
  const recommendedGear = document.querySelector(".recommended-gear");
  if (data?.suggestedGear == 15) {
    recommendedGear.style.opacity = 0;
  } else {
    recommendedGear.innerText = data.suggestedGear
    recommendedGear.style.opacity = 1;
    const shiftType = data.suggestedGear > data.currentGear ? "up" : "down";
    recommendedGear.setAttribute("data-shift", shiftType);
  }

  document.querySelector("#brake .pedal-pressure").style.transform = `scaleY(${data.brake/255})`;
  document.querySelector("#throttle .pedal-pressure").style.transform = `scaleY(${data.throttle/255})`;
  
  const speedInMph = Math.round(data.metersPerSecond * 2.23693629);
  document.querySelector("#speed").innerText = speedInMph;

  // Rev gague
  const numRpmDots = lightUpShiftPoints(data.engineRPM, data.minAlertRPM, 10, 3, 2, 15)
  const rpmDotLights = document.querySelectorAll(".rpm-lights .rpm-dot");
  
  if (numRpmDots === 15) {
    document.querySelector(".rpm-lights").classList.add("blink")
  } else {
    document.querySelector(".rpm-lights").classList.remove("blink")
  };
  
  rpmDotLights.forEach((dot, index) => {
    if (index < numRpmDots) {
      dot.classList.add("active");
    } else {
      dot.classList.remove("active");
    }
  });
};

const reconnectToWS = () => {
  const maxRetries = 5;
  let currentAttempt = 0;

  const connect = () => {
    const ws = new WebSocket(`wss://${location.host.replace('gt7', 'gt7ws')}`);

    ws.onopen = () => {
      console.log("WebSocket connection opened!");
      document.querySelector("#error").style.display = 'none';
      document.querySelector("#error .message").innerHTML = '';
    };

    ws.onclose = () => {
      document.querySelector("#error").style.display = 'block';
      if (currentAttempt < maxRetries) {
        currentAttempt++;
        document.querySelector("#error .message").innerHTML = `WebSocket connection closed. Reconnecting... (attempt ${currentAttempt}/${maxRetries})`
        setTimeout(connect, 1000);
      } else {
        document.querySelector("#error .message").innerHTML = `WebSocket connection error`
        console.error("Failed to connect to WebSocket after", maxRetries, "attempts.");
      }
    };

    ws.onmessage = updateDashboard;
  };

  connect();
}
const checkOrientation = () => {
  console.log("Checking orientation innerHeight:", window.innerHeight, 'innerWidth: ', window.innerWidth);
  if (window.innerHeight > window.innerWidth) {
    document.body.classList.add("portrait");
  } else {
    document.body.classList.remove("portrait");
  }
}

window.addEventListener("resize", checkOrientation);
(() => {
  setInterval(()=>updateClock(), 1000);
  reconnectToWS();
  checkOrientation();
})()