// Create a WebSocket connection
const ws = new WebSocket(`wss://${location.host.replace('gt7', 'gt7ws')}`);
const  calculateRpmDots = (minAlertRPM, maxAlertRPM, engineRPM, numDots) => {
  const modLowRpm = minAlertRPM - 1000;
  const rpmRange = maxAlertRPM - modLowRpm
  // const percentage = (engineRPM / rpmRange) * 100
  const percentage = (engineRPM - modLowRpm) / rpmRange;
  if (percentage < 0) {
    return 0;
  }
  const dotsToActivate = Math.round(numDots * percentage);
  return dotsToActivate;
}

const calculateTyreTemp = (tempNum) => {
  // https://www.yourdatadriven.com/what-should-the-temperature-of-your-racing-car-tyres-be/
  if (tempNum < 60) {
    return "blue"; // Low grip, low degradation - Blue
  } else if (tempNum >= 60 && tempNum <= 75) {
    return "green"; // Medium grip, low degradation - Green
  } else if (tempNum >= 85 && tempNum <= 90) {
    return "yellow"; // High grip, medium degradation - Yellow
  } else if (tempNum >= 90 && tempNum <= 95) {
    return "orange"; // Very high grip, high degradation - Orange
  } else {
    return "red"; // Medium grip, very high degradation - Red
  }
}
// Handle connection open event
ws.onopen = function(event) {
  console.log("WebSocket connection opened!"), {event};
};

// Handle connection error event
ws.onerror = function(error) {
  console.error("WebSocket connection error:", error);
  document.querySelector("#error").innerHTML = JSON.stringify(error, null, 2);
  // alert("WebSocket connection error. Please reload the page.");
};

// Handle incoming messages from the server
ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  
  document.querySelector("#rpm").innerText = Math.round(data.engineRPM)
  document.querySelector("#fuel").innerText = data.gasLevel
  
  // tyre temp
  const fl = document.querySelector("#fl")
  fl.innerText = `${Math.round(data.tireSurfaceTemperature.FrontLeft)}c`
  fl.style.backgroundColor = calculateTyreTemp(data.tireSurfaceTemperature.FrontLeft)
  
  const fr = document.querySelector("#fr")
  fr.innerText = `${Math.round(data.tireSurfaceTemperature.FrontRight)}c`
  fr.style.backgroundColor = calculateTyreTemp(data.tireSurfaceTemperature.FrontRight)
  
  const rl = document.querySelector("#rl")
  rl.innerText = `${Math.round(data.tireSurfaceTemperature.RearLeft)}c`
  rl.style.backgroundColor = calculateTyreTemp(data.tireSurfaceTemperature.RearLeft)

  const rr = document.querySelector("#rr")
  rr.innerText = `${Math.round(data.tireSurfaceTemperature.RearRight)}c`
  rr.style.backgroundColor = calculateTyreTemp(data.tireSurfaceTemperature.RearRight)
  
  document.querySelector(".laps .current").innerText = data.lapCount
  document.querySelector(".laps .total").innerText = data.lapsInRace
  
  document.querySelector(".position .current").innerText = data.preRaceStartPositionOrQualiPos
  document.querySelector(".position .total").innerText = data.numCarsAtPreRace
  
  document.querySelector(".current-gear").innerText = data.currentGear
  
  if (data?.suggestedGear == 15) {
    document.querySelector(".recommended-down-gear").style.opacity = 0;
    document.querySelector(".recommended-up-gear").style.opacity = 0;
  } else if (data.suggestedGear > data.currentGear) {
    document.querySelector(".recommended-up-gear").innerText = data.suggestedGear
    document.querySelector(".recommended-up-gear").style.opacity = 1;
    document.querySelector(".recommended-down-gear").style.opacity = 0;
  } else if (data.suggestedGear < data.currentGear) {
    document.querySelector(".recommended-down-gear").innerText = data.suggestedGear
    document.querySelector(".recommended-up-gear").style.opacity = 0;
    document.querySelector(".recommended-down-gear").style.opacity = 1;
  }
  document.querySelector("#brake .pedal-pressure").style.transform = `scaleY(${data.brake/255})`;
  document.querySelector("#throttle .pedal-pressure").style.transform = `scaleY(${data.throttle/255})`;
  
  const speedInMph = Math.round(data.metersPerSecond * 2.23693629);
  document.querySelector("#speed").innerText = speedInMph;

  // Rev gague
  const numRpmDots = calculateRpmDots(data.minAlertRPM, data.maxAlertRPM, data.engineRPM, 15)
  const rpmDotLights = document.querySelectorAll(".rpm-lights .rpm-dot");
  rpmDotLights.forEach((dot, index) => {
    if (index < numRpmDots) {
      dot.classList.add("active");
    } else {
      dot.classList.remove("active");
    }
  });
  
  // console.log("Message received from the server:", JSON.parse(event.data));
  
  // You can process the received data here
};

// Handle connection close event
ws.onclose = function(event) {
  console.log("WebSocket connection closed:", event);
};
