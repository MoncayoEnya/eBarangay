// src/services/cvrpService.js
// Capacitated Vehicle Routing Problem (CVRP) solver
// Uses Clarke-Wright Savings Algorithm — classic CS optimization technique
// CS Concepts demonstrated: Graph algorithms, Greedy optimization, NP-hard problem approximation

/**
 * Haversine distance between two GPS points in km
 */
export const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

/**
 * Estimate waste volume per stop (kg) based on type and stop index
 * In production this would come from real data
 */
const estimateWasteVolume = (stop, wasteType) => {
  const base = { Biodegradable: 120, 'Non-Biodegradable': 80, Recyclable: 60, 'Special Waste': 40 };
  const b = base[wasteType] || 90;
  // Add ±20% random variation to simulate real variance
  return Math.round(b * (0.8 + Math.random() * 0.4));
};

/**
 * Clarke-Wright Savings Algorithm for CVRP
 *
 * Algorithm steps:
 * 1. Start: each stop gets its own dedicated route from depot → stop → depot
 * 2. Calculate "savings" for merging two stops into one route:
 *    savings(i,j) = dist(depot,i) + dist(depot,j) - dist(i,j)
 * 3. Sort savings descending
 * 4. Greedily merge routes if capacity constraint is not violated
 * 5. Return final routes assigned to vehicles
 *
 * Time complexity: O(n² log n) where n = number of stops
 * This is a well-known polynomial approximation for NP-hard VRP
 */
export const solveCVRP = (depot, stops, vehicles, wasteType = 'Biodegradable') => {
  if (!stops.length || !vehicles.length) return [];

  // Assign demand (waste volume) to each stop
  const stopsWithDemand = stops.map((s, i) => ({
    ...s,
    demand: estimateWasteVolume(s, wasteType),
    id: i,
  }));

  // ── Step 1: Build distance matrix ──
  const allNodes = [depot, ...stopsWithDemand];
  const dist = (a, b) => haversineKm(a.lat, a.lng, b.lat, b.lng);

  // ── Step 2: Calculate Clarke-Wright savings ──
  const savings = [];
  for (let i = 0; i < stopsWithDemand.length; i++) {
    for (let j = i + 1; j < stopsWithDemand.length; j++) {
      const si = stopsWithDemand[i];
      const sj = stopsWithDemand[j];
      const saving =
        dist(depot, si) + dist(depot, sj) - dist(si, sj);
      savings.push({ i: si.id, j: sj.id, saving });
    }
  }

  // ── Step 3: Sort savings descending ──
  savings.sort((a, b) => b.saving - a.saving);

  // ── Step 4: Initialize — each stop is its own route ──
  // routeOf[stopId] = routeIndex
  // routes[routeIndex] = { stops: [...], load: kg, vehicleIdx: -1 }
  const routes = stopsWithDemand.map(s => ({
    stops:      [s],
    load:       s.demand,
    vehicleIdx: -1,
  }));
  const routeOf = {};
  stopsWithDemand.forEach((s, i) => { routeOf[s.id] = i; });

  // Capacity of each vehicle in kg (default 800kg if not specified)
  const getCapacity = (vIdx) => {
    const v = vehicles[vIdx];
    return (v?.capacityKg || 800);
  };

  // ── Step 5: Greedy merge ──
  // Track which routes are still "active" (not merged into another)
  const active = new Set(routes.map((_, i) => i));

  for (const { i, j, saving } of savings) {
    if (saving <= 0) break; // No more beneficial merges

    const ri = routeOf[i];
    const rj = routeOf[j];
    if (ri === rj) continue; // Already in same route

    const routeI = routes[ri];
    const routeJ = routes[rj];

    if (!active.has(ri) || !active.has(rj)) continue;

    // Check if i is at the END of its route and j is at the START of its route
    const iAtEnd  = routeI.stops[routeI.stops.length - 1].id === i;
    const jAtStart = routeJ.stops[0].id === j;

    if (!iAtEnd || !jAtStart) continue;

    // Find a vehicle with enough capacity
    const combinedLoad = routeI.load + routeJ.load;
    let vIdx = routeI.vehicleIdx;

    if (vIdx === -1) {
      // Try to find an unassigned vehicle
      const usedVehicles = new Set(routes.filter((r, idx) => active.has(idx)).map(r => r.vehicleIdx).filter(v => v !== -1));
      for (let v = 0; v < vehicles.length; v++) {
        if (!usedVehicles.has(v) && combinedLoad <= getCapacity(v)) {
          vIdx = v; break;
        }
      }
      if (vIdx === -1) {
        // Use first vehicle that fits
        for (let v = 0; v < vehicles.length; v++) {
          if (combinedLoad <= getCapacity(v)) { vIdx = v; break; }
        }
      }
    }

    if (vIdx === -1) continue; // No vehicle fits
    if (combinedLoad > getCapacity(vIdx)) continue; // Capacity exceeded

    // ── Merge routeJ into routeI ──
    const merged = {
      stops:      [...routeI.stops, ...routeJ.stops],
      load:       combinedLoad,
      vehicleIdx: vIdx,
    };

    const mergedIdx = routes.length;
    routes.push(merged);
    merged.stops.forEach(s => { routeOf[s.id] = mergedIdx; });

    active.delete(ri);
    active.delete(rj);
    active.add(mergedIdx);
  }

  // ── Step 6: Build final routes ──
  // Assign unassigned vehicles to routes without one
  const finalRoutes = [];
  let vehicleAssignIdx = 0;

  for (const routeIdx of active) {
    const route = routes[routeIdx];
    if (route.vehicleIdx === -1) {
      route.vehicleIdx = vehicleAssignIdx % vehicles.length;
      vehicleAssignIdx++;
    }

    const vehicle   = vehicles[route.vehicleIdx] || vehicles[0];
    const tourStops = [
      { ...depot, label: depot.label || 'Barangay Hall (Start)', isDepot: true },
      ...route.stops,
      { ...depot, label: 'Return to Hall / MRF', isDepot: true },
    ];

    // Calculate route distance
    let distKm = 0;
    for (let k = 0; k < tourStops.length - 1; k++) {
      distKm += haversineKm(tourStops[k].lat, tourStops[k].lng, tourStops[k+1].lat, tourStops[k+1].lng);
    }

    const estMinutes = Math.round((distKm / 15) * 60 + route.stops.length * 6);
    const utilization = Math.round((route.load / (vehicle?.capacityKg || 800)) * 100);

    finalRoutes.push({
      vehicle,
      stops:        tourStops,
      totalLoad:    route.load,
      capacityKg:   vehicle?.capacityKg || 800,
      utilization,  // % of capacity used
      distKm:       distKm.toFixed(2),
      estMinutes,
      stopCount:    route.stops.length,
    });
  }

  // Sort by distance ascending
  finalRoutes.sort((a, b) => parseFloat(a.distKm) - parseFloat(b.distKm));

  return finalRoutes;
};

/**
 * Get AI insights for a CVRP solution from Groq
 */
export const getCVRPInsights = async (routes, barangayName, wasteType) => {
  try {
    const summary = routes.map(r =>
      `Vehicle: ${r.vehicle?.name||'Truck'}, Stops: ${r.stopCount}, Load: ${r.totalLoad}kg/${r.capacityKg}kg (${r.utilization}%), Distance: ${r.distKm}km, Time: ${r.estMinutes}min`
    ).join('\n');

    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 400,
        messages: [
          { role: 'system', content: 'You are a waste management optimizer for Cebu City barangays. Respond ONLY with valid JSON, no markdown.' },
          { role: 'user', content: `CVRP solution for Barangay ${barangayName}, waste type: ${wasteType}.\n\nRoutes:\n${summary}\n\nRespond ONLY: {"overall_efficiency":<0-100>,"total_fuel_liters":<number>,"tips":[3 short strings],"risk_areas":[2 short strings],"recommended_start_time":"<HH:MM AM/PM>"}` }
        ]
      })
    });
    const data = await resp.json();
    return JSON.parse((data.choices?.[0]?.message?.content || '{}').replace(/```json|```/g, '').trim());
  } catch (_) {
    return {
      overall_efficiency: Math.round(routes.reduce((s, r) => s + r.utilization, 0) / routes.length),
      total_fuel_liters: (routes.reduce((s, r) => s + parseFloat(r.distKm), 0) / 4).toFixed(1),
      tips: [
        `Start at 5:30 AM before peak traffic in Brgy. ${barangayName}`,
        'Heavier-loaded trucks should take flatter routes first',
        'Coordinate truck departure times to avoid overlapping at narrow sitios',
      ],
      risk_areas: ['Riverside sitios — muddy roads after rain', 'Market areas — heavy foot traffic 7–9 AM'],
      recommended_start_time: '5:30 AM',
    };
  }
};