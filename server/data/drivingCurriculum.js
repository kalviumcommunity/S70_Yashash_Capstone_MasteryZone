// Comprehensive Driving & Vehicle Dynamics Curriculum Dataset for Mastery Zone
// Tracks: Car Driving (car), Motorcycle (bike), Commercial Heavy Truck (truck)
// Each module has in-depth instructional content, a practical engineering/physics assignment,
// and exactly 10 proctored assessment MCQs with server-side validation.

const DRIVING_CURRICULUM = {
  car: [
    {
      id: "car_mod_0",
      trackId: "car",
      subjectKey: "driving",
      moduleIndex: 0,
      title: "Vehicle Dynamics, Braking Physics & Stopping Distances",
      subtitle: "Master the mathematical physics of thinking distance, braking distance, ABS slip modulation, and tyre friction coefficients.",
      estimatedTime: "30 mins",
      icon: "car",
      overview:
        "Understand total stopping distance as a function of reaction time and kinetic energy dissipation ($E_k = \\frac{1}{2}mv^2$). Learn the operation of Anti-lock Braking Systems (ABS), Electronic Brakeforce Distribution (EBD), and weight transfer under deceleration.",
      sections: [
        {
          title: "1. The Physics of Total Stopping Distance",
          content: `Total Stopping Distance is the sum of two distinct physical phases:
$$\\text{Stopping Distance} = \\text{Thinking Distance} + \\text{Braking Distance}$$

1. **Thinking Distance ($d_t$)**: The linear distance travelled while the driver recognizes a hazard and applies the brake pedal:
$$d_t = v \\times t_r$$
Where $v$ is vehicle velocity (in m/s) and $t_r$ is driver perception-reaction time (typically $0.75\\text{ s}$ to $1.5\\text{ s}$).

2. **Braking Distance ($d_b$)**: Derived from kinetic energy dissipation against tyre-road friction:
$$\\frac{1}{2}mv^2 = \\mu m g d_b \\implies d_b = \\frac{v^2}{2\\mu g}$$
Where $\\mu$ is the coefficient of friction (dry asphalt $\\approx 0.8$, wet asphalt $\\approx 0.4$, icy road $\\approx 0.1$) and $g = 9.81\\text{ m/s}^2$.

**Critical Dynamic Principle**: Because velocity is squared ($v^2$), doubling vehicle speed quadruples ($4\\times$) the braking distance!`,
          example: `Calculation Example at 100 km/h (27.78 m/s):
- Reaction time (1.0 s): 27.78 m
- Braking distance (dry asphalt, μ = 0.8): (27.78^2) / (2 * 0.8 * 9.81) ≈ 49.16 m
- Total Stopping Distance: 27.78 + 49.16 ≈ 76.94 metres!`,
        },
        {
          title: "2. Traction Circle, Weight Transfer & ABS Dynamics",
          content: `A tyre contact patch has a finite budget of adhesion defined by Kamm's Friction Circle:
- If 100% of tyre traction is consumed by heavy braking, 0% remains for lateral steering control.
- **Dynamic Weight Transfer**: During hard deceleration, load transfers from the rear axle to the front axle:
$$\\Delta W = \\frac{m \\cdot a \\cdot h_{cg}}{L}$$
Where $h_{cg}$ is center-of-gravity height and $L$ is wheelbase. This unweights the rear tyres, increasing susceptibility to rear-end lockup and oversteer.
- **Anti-lock Braking System (ABS)**: Rapidly pulses brake caliper hydraulic pressure (15–20 times/second) to keep tyre slip in the optimal 10%–20% friction window, preventing wheel lockup and preserving steering control.`,
          example: `In an emergency stop in an ABS-equipped vehicle:
Firmly stomp and maintain continuous pressure on the brake pedal; do not pump the brakes!`,
        },
      ],
      practicalAssignment: {
        id: "car_assign_0",
        type: "driving_calculation",
        taskTitle: "Stopping Distance & Friction Budget Calculation",
        instructions:
          "Calculate total stopping distance for a passenger car traveling at 90 km/h on wet asphalt (mu = 0.40) with a driver reaction time of 1.2 seconds.",
        promptText:
          "Compute:\n1. Vehicle velocity in m/s (90 km/h / 3.6).\n2. Thinking distance (v * 1.2s).\n3. Braking distance with mu = 0.40 and g = 9.81 m/s^2.\n4. Total stopping distance in metres.",
        solutionKeywords: ["25", "30", "79.6", "109.6"],
        criteria:
          "Correct conversion from km/h to m/s (25 m/s), thinking distance of 30.0 m, braking distance of ~79.6 m, and total stopping distance of ~109.6 m.",
      },
      assessment: {
        timeLimitSeconds: 600,
        passingScore: 80,
        questions: [
          {
            id: "car0_q1",
            question: "When vehicle speed increases from 50 km/h to 100 km/h, by what factor does braking distance increase under identical friction conditions?",
            options: ["2 times", "3 times", "4 times", "8 times"],
            correctIndex: 2,
            explanation: "Braking distance is proportional to velocity squared (v²). Doubling speed (2x) results in (2)² = 4 times the braking distance.",
          },
          {
            id: "car0_q2",
            question: "What is the primary operational objective of an Anti-lock Braking System (ABS)?",
            options: [
              "To shorten braking distance on ice and loose gravel",
              "To prevent wheel lockup, allowing the driver to steer while braking heavily",
              "To automatically apply emergency parking brakes",
              "To eliminate mechanical brake pad wear",
            ],
            correctIndex: 1,
            explanation: "The primary safety benefit of ABS is preventing wheel lockup so the front tyres retain lateral grip, allowing directional steering control during panic braking.",
          },
          {
            id: "car0_q3",
            question: "Under Kamm's friction circle theory, what happens when 100% of available tyre traction is utilized for longitudinal braking?",
            options: [
              "Lateral grip increases by 50%",
              "Zero lateral grip remains for directional steering",
              "The vehicle turns instantaneously",
              "Tyre temperature drops to ambient",
            ],
            correctIndex: 1,
            explanation: "The total friction vector is the geometric sum of longitudinal and lateral grip. If 100% of adhesion is expended in braking, zero lateral grip remains for steering.",
          },
          {
            id: "car0_q4",
            question: "What physical phenomenon occurs during heavy braking due to vehicle deceleration acting through the center of gravity?",
            options: [
              "Rearward load transfer",
              "Forward load transfer onto the front axle",
              "Equal reduction in tyre contact patch area on all four wheels",
              "Gyroscopic inversion",
            ],
            correctIndex: 1,
            explanation: "Inertia acts forward at the center of gravity while tyre braking forces act backward at ground level, creating a pitch moment that transfers dynamic vertical load onto the front axle.",
          },
          {
            id: "car0_q5",
            question: "On wet asphalt with a coefficient of friction of mu = 0.4 compared to dry asphalt of mu = 0.8, what happens to braking distance?",
            options: ["It is halved", "It remains unchanged", "It roughly doubles", "It increases by ten times"],
            correctIndex: 2,
            explanation: "Braking distance is inversely proportional to friction coefficient (d = v² / (2μg)). Halving μ from 0.8 to 0.4 doubles the braking distance.",
          },
          {
            id: "car0_q6",
            question: "What is the correct driver technique when performing an emergency stop in a modern vehicle equipped with ABS?",
            options: [
              "Pump the brake pedal rapidly to simulate cadence braking",
              "Apply maximum continuous pressure on the brake pedal without pumping",
              "Apply only the mechanical emergency handbrake",
              "Shift into neutral and avoid depressing the brake pedal",
            ],
            correctIndex: 1,
            explanation: "With ABS, the computer modulates pressure dozens of times per second. Pumping the pedal interferes with the system; drivers must press firmly and hold.",
          },
          {
            id: "car0_q7",
            question: "What term describes the dangerous phenomenon where tyre tread fails to evacuate standing water, resulting in the tyre riding on a water wedge?",
            options: ["Aerodynamic stall", "Hydroplaning (Aquaplaning)", "Cadence skidding", "Camber thrust"],
            correctIndex: 1,
            explanation: "Aquaplaning occurs when water pressure builds in front of the contact patch faster than tread sipes can evacuate it, lifting tyre off the asphalt completely.",
          },
          {
            id: "car0_q8",
            question: "Which factor does NOT affect the driver's perception-reaction (thinking) distance?",
            options: ["Driver fatigue and alcohol impairment", "Vehicle speed", "Tyre tread depth and rubber compound", "Cognitive distraction"],
            correctIndex: 2,
            explanation: "Thinking distance depends strictly on vehicle velocity and human reaction time. Tyre tread depth and rubber compound only affect mechanical braking distance after pedal application.",
          },
          {
            id: "car0_q9",
            question: "What safety role does Electronic Brakeforce Distribution (EBD) perform in coordination with ABS?",
            options: [
              "It increases engine horsepower during high-speed cruising",
              "It regulates hydraulic brake line pressure to each wheel independently based on dynamic axle loading",
              "It automatically shifts automatic transmissions down two gears",
              "It regulates tyre inflation pressure on the fly",
            ],
            correctIndex: 1,
            explanation: "EBD balances brake pressure between front and rear axles dynamically, preventing rear-wheel lockup when the rear axle becomes unweighted under heavy deceleration.",
          },
          {
            id: "car0_q10",
            question: "If a vehicle travels at 72 km/h (20 m/s) and the driver has a reaction time of 1.5 seconds, what distance does the car travel before the brakes are even touched?",
            options: ["15 metres", "20 metres", "30 metres", "45 metres"],
            correctIndex: 2,
            explanation: "Thinking distance = v * t = 20 m/s * 1.5 s = 30 metres.",
          },
        ],
      },
    },
    {
      id: "car_mod_1",
      trackId: "car",
      subjectKey: "driving",
      moduleIndex: 1,
      title: "Defensive Driving, Intersection Priority & Roundabout Navigation",
      subtitle: "Master hazard anticipation, the 2-second time-gap rule, multi-lane roundabout lane discipline, and right-of-way hierarchies.",
      estimatedTime: "35 mins",
      icon: "car",
      overview:
        "Develop advanced hazard perception skills, calculate variable following intervals based on meteorological conditions, and execute flawless right-of-way decisions across complex urban intersections and multi-lane roundabouts.",
      sections: [
        {
          title: "1. The 2-Second Time Gap & Space Cushioning",
          content: `Safe following distance is governed by elapsed time rather than fixed vehicle lengths:
- **Normal Dry Conditions**: Minimum **2 seconds** following interval behind the lead vehicle.
  - Fixate on a stationary landmark (overhead sign, tree, lamp post).
  - When the vehicle ahead passes it, count: *"One thousand and one, one thousand and two."*
  - If your bumper reaches the marker before finishing, ease off the accelerator.
- **Wet Conditions**: Double the gap to **4 seconds**.
- **Icy or Snow-Covered Roads**: Multiply the interval to **10 seconds**.
- **Escape Route Principle**: Always maintain a buffer zone (space cushion) ahead, to the sides, and behind your vehicle to preserve an evasive exit path.`,
          example: `Following gap table:
- Dry: 2 seconds
- Rain/Spray: 4 seconds
- Snow/Ice: 10 seconds`,
        },
        {
          title: "2. Roundabout Lane Discipline & Signal Protocols",
          content: `Roundabouts prioritize circulating traffic over entering traffic:
- **Approaching**: Give way to traffic approaching from your immediate circulating side (from the right in left-hand drive countries, from the left in right-hand drive countries).
- **Turning Left / Taking First Exit (< 180°)**:
  - Approach in the outer/curb lane.
  - Signal before entry and maintain signal until exit.
- **Continuing Straight (Second Exit ≈ 180°)**:
  - Approach in the appropriate intermediate or outer lane with no signal on entry.
  - Signal exit intent immediately after passing the exit prior to the intended exit.
- **Turning Right / Full Loop (> 180°)**:
  - Approach in the inner/center lane with the corresponding turn signal engaged.
  - Transition smoothly across lane spirals while signaling exit intent.`,
          example: `Golden Rule: Never overtake long heavy commercial vehicles within a roundabout; their trailers cut across inner lanes via off-tracking.`,
        },
      ],
      practicalAssignment: {
        id: "car_assign_1",
        type: "driving_scenario",
        taskTitle: "Intersection Priority & Roundabout Route Planning",
        instructions:
          "Analyze the multi-lane roundabout scenario provided and submit the correct lane selection and signaling sequence.",
        promptText:
          "Scenario: You are approaching a four-arm multi-lane roundabout and need to take the 3rd exit (turning 270 degrees). Which entry lane do you choose, what is your initial signal, and when do you signal to exit?",
        solutionKeywords: ["inner lane", "left lane", "right lane", "signal left", "signal right", "after passing second exit"],
        criteria:
          "Correct selection of the inner/turn lane, engaging turn signal prior to entry, and signaling exit after passing the second exit.",
      },
      assessment: {
        timeLimitSeconds: 600,
        passingScore: 80,
        questions: [
          {
            id: "car1_q1",
            question: "Under standard dry conditions, what is the minimum recommended following time interval behind the vehicle ahead?",
            options: ["0.5 seconds", "1 second", "2 seconds", "5 seconds"],
            correctIndex: 2,
            explanation: "The internationally recognized baseline following rule is 2 seconds under clear, dry conditions.",
          },
          {
            id: "car1_q2",
            question: "During heavy rainfall with road spray, how should a defensive driver adjust the 2-second following interval?",
            options: [
              "Maintain 2 seconds and flash high beams",
              "Increase the interval to at least 4 seconds",
              "Reduce the interval to 1 second to follow tire tracks",
              "Keep the interval identical but turn off wipers",
            ],
            correctIndex: 1,
            explanation: "Wet conditions reduce tyre friction and increase reaction times; the following gap must be doubled to at least 4 seconds.",
          },
          {
            id: "car1_q3",
            question: "When entering a standard roundabout, which traffic has legal right-of-way priority?",
            options: [
              "Vehicles entering the roundabout at highest velocity",
              "Vehicles already circulating within the roundabout",
              "Heavy commercial trucks entering from the left",
              "Vehicles intending to take the first exit",
            ],
            correctIndex: 1,
            explanation: "Traffic already circulating on the roundabout circulatory roadway possesses right-of-way over entering traffic.",
          },
          {
            id: "car1_q4",
            question: "At an uncontrolled four-way intersection (no signs or lights), who has right-of-way under the standard rule in right-hand traffic?",
            options: [
              "The driver approaching from the left",
              "The driver approaching from the right",
              "The vehicle turning left across oncoming traffic",
              "The larger vehicle",
            ],
            correctIndex: 1,
            explanation: "Under the standard priority-to-the-right rule in right-hand traffic jurisdictions, drivers must yield to vehicles approaching from their right.",
          },
          {
            id: "car1_q5",
            question: "When should a driver engage the directional indicator signal when exiting a multi-lane roundabout?",
            options: [
              "500 metres before entering the roundabout",
              "Immediately after passing the exit prior to the intended exit",
              "Only after the vehicle has fully straightened out on the exit roadway",
              "Never, roundabouts prohibit directional signaling",
            ],
            correctIndex: 1,
            explanation: "To give clear notice without misleading entering motorists, signal exit immediately upon passing the splitter island of the exit just before your desired exit.",
          },
          {
            id: "car1_q6",
            question: "Why is it hazardous to drive alongside an articulated semi-trailer inside a multi-lane roundabout?",
            options: [
              "Trucks generate destructive crosswinds",
              "The trailer sweeps inward across lanes due to off-tracking geometry",
              "Air brakes emit dangerous exhaust fumes",
              "Trucks reverse frequently in roundabouts",
            ],
            correctIndex: 1,
            explanation: "Articulated commercial vehicles exhibit off-tracking: their rear trailer wheels follow a tighter radius than the cab, sweeping across adjoining lanes.",
          },
          {
            id: "car1_q7",
            question: "What is the primary purpose of the 'two-second rule' compared to fixed car-length rules?",
            options: [
              "It automatically scales safe following distance in direct proportion to vehicle speed",
              "It prevents police speed cameras from clocking velocity",
              "It ensures high fuel economy",
              "It overrides traffic signals",
            ],
            correctIndex: 0,
            explanation: "Because distance covered per second increases linearly with velocity, a time-based rule automatically expands physical buffer distance as speed rises.",
          },
          {
            id: "car1_q8",
            question: "When an emergency vehicle with active blue or red lights and sirens approaches from behind, what is the defensive protocol?",
            options: [
              "Slam on brakes immediately in your current lane",
              "Accelerate to match the emergency vehicle's speed",
              "Safely yield by signaling, moving toward the curb, and stopping where safe",
              "Drive onto the sidewalk at full speed",
            ],
            correctIndex: 2,
            explanation: "Defensive drivers check mirrors, signal intent, pull safely to the curb or outer shoulder, and bring the vehicle to a controlled stop, keeping intersections clear.",
          },
          {
            id: "car1_q9",
            question: "What is 'velocitation' in driving psychology?",
            options: [
              "An intense fear of high speeds",
              "An unconscious sensory desensitization that causes drivers to misjudge high speeds as much slower following prolonged highway driving",
              "Accelerating in reverse",
              "Tyre balance wobble",
            ],
            correctIndex: 1,
            explanation: "Velocitation is sensory adaptation: after driving fast on a highway, drivers perceive lower speeds as crawling, frequently causing dangerous late braking on off-ramps.",
          },
          {
            id: "car1_q10",
            question: "What does a solid white line between lanes on a multi-lane highway or intersection approach designate?",
            options: [
              "Passing is actively encouraged",
              "Lane changes are hazardous and strongly discouraged or prohibited",
              "The lane is designated solely for autonomous vehicles",
              "Pedestrians may cross at will",
            ],
            correctIndex: 1,
            explanation: "A solid single white line indicates lane changes are dangerous and legally discouraged or prohibited in critical transition zones.",
          },
        ],
      },
    },
  ],
  bike: [
    {
      id: "bike_mod_0",
      trackId: "bike",
      subjectKey: "driving",
      moduleIndex: 0,
      title: "Motorcycle Physics: Gyroscopic Precession & Counter-Steering",
      subtitle: "Deconstruct the dynamic physics of two-wheeled single-track vehicles: out-tracking, camber thrust, and roll coupling.",
      estimatedTime: "30 mins",
      icon: "bike",
      overview:
        "Understand why pushing forward on the right handlebar rolls the motorcycle to the right at speeds above single-track stability threshold (~15 km/h). Master apex line geometry and trail braking.",
      sections: [
        {
          title: "1. The Physics of Counter-Steering",
          content: `At speeds above walking pace (~15 km/h), a single-track vehicle cannot be steered by turning handlebars directly into the curve:
- **Out-Tracking Mechanics**:
  - Pushing the **right handlebar forward** steers the front wheel momentarily to the **left**.
  - The tyre contact patches move out from beneath the motorcycle's center of mass to the left.
  - Gravity creates an unbalanced torque that causes the motorcycle to roll/lean to the **right**.
- **Camber Thrust**: Once leaned, the curved profile of the motorcycle tyre generates lateral force (*camber thrust*) that carves the turn through the corner.
- **Rule of Thumb**: *"Push left, lean left, go left. Push right, lean right, go right."*`,
          example: `To swerve rapidly around an obstacle on the right:
Push the left handlebar forward firmly to induce instantaneous leftward roll.`,
        },
        {
          title: "2. Traction Management: Trail Braking & Friction Circle",
          content: `Front brake application accounts for up to 70%–90% of a motorcycle's total deceleration capability due to forward weight transfer:
- **Trail Braking**: The technique of maintaining trailing front brake pressure past the corner entry point and progressively easing pressure toward the apex as lean angle increases.
- **Danger of Panic Braking While Leaned**:
  - Grabbing the front brake abruptly while leaned exceeds available tyre traction, inducing immediate lowside front wheel wash-out or violently standing the bike upright into oncoming traffic.`,
          example: `Smoothness Principle: Never combine 100% brake with 100% lean angle!`,
        },
      ],
      practicalAssignment: {
        id: "bike_assign_0",
        type: "driving_scenario",
        taskTitle: "Cornering Line & Counter-Steering Input Analysis",
        instructions:
          "Analyze the cornering scenario and indicate handlebar directional input and braking allocation.",
        promptText:
          "Scenario: Approaching a sweeping right-hand curve at 60 km/h. What handlebar input initiates the lean, and how should brake pressure be modulated as lean angle increases toward the apex?",
        solutionKeywords: ["push right", "press right", "trail braking", "ease off", "decrease brake"],
        criteria:
          "Correct identification of pushing the right handlebar forward and progressively trailing off brake pressure as lean increases.",
      },
      assessment: {
        timeLimitSeconds: 600,
        passingScore: 80,
        questions: [
          {
            id: "bk0_q1",
            question: "To initiate a right turn on a motorcycle traveling at 50 km/h, what input must the rider apply to the handlebars?",
            options: [
              "Pull the right grip back toward the chest",
              "Push the right handlebar forward (counter-steer)",
              "Lean body weight only without touching the handlebars",
              "Turn the front wheel sharply to the right",
            ],
            correctIndex: 1,
            explanation: "Counter-steering requires pushing forward on the handlebar on the side of the desired turn (push right to lean right).",
          },
          {
            id: "bk0_q2",
            question: "Why does the front wheel on a motorcycle provide up to 70% to 90% of total stopping force during hard braking?",
            options: [
              "The front tyre is composed of different rubber than the rear",
              "Dynamic forward weight transfer loads the front suspension and tyre while unweighting the rear",
              "The front brake lever is larger than the foot pedal",
              "Engine braking disables the rear tyre",
            ],
            correctIndex: 1,
            explanation: "Deceleration creates an inertial pitch moment that transfers weight onto the front tyre contact patch, greatly increasing its traction limit.",
          },
          {
            id: "bk0_q3",
            question: "What catastrophic crash dynamic occurs when a rider locks the rear wheel into a sideways skid and then abruptly releases the brake while out of line?",
            options: ["Lowside crash", "Highside crash", "Stoppie", "Weave divergence"],
            correctIndex: 1,
            explanation: "Releasing the locked rear brake while the tyre is out of line abruptly re-establishes traction, violently snapping the motorcycle upright and catapulting the rider over the top (highside).",
          },
          {
            id: "bk0_q4",
            question: "What is 'camber thrust' in motorcycle tyre dynamics?",
            options: [
              "Aerodynamic drag produced by footpegs",
              "A lateral force generated perpendicular to the wheel plane when an elastic tyre is operated at a lean angle",
              "Exhaust backpressure assistance",
              "Chain tension variation",
            ],
            correctIndex: 1,
            explanation: "Camber thrust is the side force generated when an inclined tyre rolls, acting like a cone rolling in a circle to turn the motorcycle.",
          },
          {
            id: "bk0_q5",
            question: "What is the recommended riding formation for a group of motorcyclists on an open highway?",
            options: [
              "Direct single file spaced 1 metre apart",
              "Side-by-side in the same lane",
              "Staggered formation with 2 seconds following distance between alternating riders",
              "V-formation across all available highway lanes",
            ],
            correctIndex: 2,
            explanation: "A staggered formation maintains adequate space cushions and clear sightlines while giving each rider room to swerve or brake.",
          },
          {
            id: "bk0_q6",
            question: "In motorcycle terminology, what does 'Trail Braking' specifically describe?",
            options: [
              "Using only the rear brake on dirt trails",
              "Carrying front brake pressure into the corner past the entry point, progressively releasing it as lean angle increases to the apex",
              "Locking the brakes to slide around hairpins",
              "Braking only when following a trail vehicle",
            ],
            correctIndex: 1,
            explanation: "Trail braking involves progressively trailing off brake pressure as lean angle increases toward the corner apex.",
          },
          {
            id: "bk0_q7",
            question: "What surface hazard poses the greatest sudden drop in friction coefficient for a motorcycle during the first 10 minutes of light rain?",
            options: [
              "Dry brushed concrete",
              "Painted white road lines and metal manhole covers coated with mixed oil residue",
              "Freshly laid coarse aggregate asphalt",
              "Rubber tyre markers on a drag strip",
            ],
            correctIndex: 1,
            explanation: "The first rainfall lifts dry oil and grease to the surface, creating an emulsion that turns smooth painted lines and metal utilities into ice-slick surfaces.",
          },
          {
            id: "bk0_q8",
            question: "What is the 'Contact Patch' of an average motorcycle tyre?",
            options: [
              "The entire circumference of the wheel rim",
              "An area roughly the size of a standard credit card where rubber meets road",
              "The side sidewall of the tyre",
              "The tyre valve stem area",
            ],
            correctIndex: 1,
            explanation: "A motorcycle's contact patch is remarkably small—approximately the footprint of a credit card per tyre—making smooth weight transfer critical.",
          },
          {
            id: "bk0_q9",
            question: "What is the primary visual technique recommended for cornering on a motorcycle?",
            options: [
              "Stare fixated directly at the front fender",
              "Turn your head and look through the corner toward your intended exit path",
              "Watch the rear view mirror continuously",
              "Keep eyes closed during transition",
            ],
            correctIndex: 1,
            explanation: "Target fixation dictates that motorcycles go where the eyes look. Riders must turn their head and look far ahead through the curve to the vanishing point.",
          },
          {
            id: "bk0_q10",
            question: "What does the 'T-CLOCS' pre-ride inspection acronym stand for?",
            options: [
              "Time, Clock, Location, Orientation, Coordinates, Speed",
              "Tyres, Controls, Lights, Oil, Chassis, Stands",
              "Throttle, Clutch, Oil, Chains, Suspension",
              "Track, Circuit, Laps, Orbit, Cruise, Stop",
            ],
            correctIndex: 1,
            explanation: "T-CLOCS is the Motorcycle Safety Foundation's pre-ride checklist: Tyres & Wheels, Controls, Lights & Electrics, Oil & Fluids, Chassis, and Stands.",
          },
        ],
      },
    },
  ],
};

module.exports = { DRIVING_CURRICULUM };
