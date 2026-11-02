// Comprehensive Fitness, Exercise Physiology & Biomechanics Curriculum Dataset for Mastery Zone
// Tracks: Strength Training (strength), Cardio & Conditioning (cardio), Nutrition & Metabolism (nutrition)
// Each module has in-depth instructional content, a practical biomechanics/macronutrient assignment,
// and exactly 10 proctored assessment MCQs with server-side validation.

const FITNESS_CURRICULUM = {
  strength: [
    {
      id: "fit_mod_0",
      trackId: "strength",
      subjectKey: "fitness",
      moduleIndex: 0,
      title: "Biomechanics of Fundamental Compound Movements",
      subtitle: "Master moment arms, joint torque distribution, spinal shearing vs compression, and optimal bar-path mechanics in Squat, Bench, and Deadlift.",
      estimatedTime: "35 mins",
      icon: "strength",
      overview:
        "Understand the mechanical principles governing multi-joint resistance training. Calculate joint moment arms ($M = F \\times d_\\perp$), analyze spinal shear versus compressive loading, and engineer efficient levers based on individual anthropometry.",
      sections: [
        {
          title: "1. Moment Arms, Torques & Center of Mass",
          content: `Joint torque is the rotational force required by musculature to overcome an external barbell load:
$$\\tau = F \\times d_{\\perp}$$
Where $F$ is barbell gravitational load ($m \\times g$) and $d_{\\perp}$ is the perpendicular horizontal distance from the joint axis of rotation to the vertical barbell line of gravity.

- **Squat Mechanics (Low Bar vs High Bar)**:
  - Low Bar: Positioned on rear deltoids. Requires greater forward torso lean, increasing hip moment arm ($d_{\\text{hip}}$) and glute/hamstring contribution.
  - High Bar: Positioned on upper trapezius. Keeps torso more upright, decreasing hip moment arm and increasing knee moment arm ($d_{\\text{knee}}$), placing greater demand on the quadriceps.
- **Midfoot Equilibrium**:
  - The barbell-lifter combined center of mass MUST stay directly over the midfoot throughout the movement to prevent wasteful rotational pitching moments.`,
          example: `If a lifter has long femurs relative to their torso:
They naturally require greater forward torso inclination in the back squat to maintain barbell balance over the midfoot.`,
        },
        {
          title: "2. Spinal Loading: Compressive vs Shearing Forces",
          content: `The human spine withstands immense axial compressive loads (squeezing vertebrae together), but is highly vulnerable to shear forces (transverse sliding across intervertebral discs):
- **Intra-Abdominal Pressure (Valsalva Maneuver)**:
  - Inhaling into the diaphragm and bracing against a closed glottis increases intra-abdominal pressure by up to 20%–40%, acting as an internal pneumatic cylinder that stiffens the torso and decreases spinal compressive stress by up to 50%.
- **Deadlift Mechanics (Conventional vs Sumo)**:
  - Conventional: Bar starts further from hips; greater spinal moment arm and lumbar shear stress.
  - Sumo: Wide stance brings hips closer to the bar line, shortening lumbar moment arm and shifting demands to hip adductors and knee extensors.`,
          example: `Never round the lumbar spine under heavy axial load:
Flexion under load produces non-uniform disc compression, pushing the nucleus pulposus posteriorly against the annulus fibrosus.`,
        },
      ],
      practicalAssignment: {
        id: "fit_assign_0",
        type: "fitness_biomechanics",
        taskTitle: "Joint Moment Arm & Lever Efficiency Analysis",
        instructions:
          "Analyze the lifter anthropometry provided and calculate relative knee vs hip moment arm demands for high-bar versus low-bar squats.",
        promptText:
          "Scenario: A lifter with long femurs is choosing between high-bar and low-bar squats. When switching to low-bar, what happens to torso angle, hip moment arm, and knee moment arm?",
        solutionKeywords: ["more forward lean", "greater hip moment", "decreased knee moment", "greater glute hamstring", "midfoot balance"],
        criteria:
          "Correct explanation of forward torso inclination, expansion of the hip moment arm, and reduction of the knee moment arm in low-bar squatting.",
      },
      assessment: {
        timeLimitSeconds: 600,
        passingScore: 80,
        questions: [
          {
            id: "fit0_q1",
            question: "In biomechanics, what is a 'moment arm' in resistance training?",
            options: [
              "The speed at which the barbell is accelerated",
              "The perpendicular horizontal distance from the joint axis of rotation to the line of gravitational resistance",
              "The circumference of the lifter's bicep",
              "The total duration of the eccentric phase",
            ],
            correctIndex: 1,
            explanation: "A moment arm is the shortest perpendicular distance between the line of action of a force (the vertical barbell path) and the joint pivot axis.",
          },
          {
            id: "fit0_q2",
            question: "Why does the Low-Bar back squat elicit greater hip extensor (glute and hamstring) activation than the High-Bar squat?",
            options: [
              "The bar is held in the lifter's hands rather than on the shoulders",
              "The lower bar placement forces greater forward torso lean, lengthening the horizontal hip moment arm",
              "Low-bar squats eliminate all knee flexion",
              "The lifter uses a narrower stance width",
            ],
            correctIndex: 1,
            explanation: "Because the bar sits lower on the posterior deltoids, the lifter must lean further forward to keep the bar over the midfoot, lengthening the horizontal distance to the hips (moment arm).",
          },
          {
            id: "fit0_q3",
            question: "What physiological mechanism occurs during a proper Valsalva Maneuver when bracing for a heavy compound lift?",
            options: [
              "Rapid hyperventilation during the concentric repetition",
              "Deep diaphragmatic inhalation followed by forced exhalation against a closed glottis, elevating intra-abdominal pressure",
              "Complete relaxation of the abdominal wall to facilitate hip mobility",
              "Squeezing the barbell grips without breathing",
            ],
            correctIndex: 1,
            explanation: "The Valsalva maneuver stiffens the core cylinder by pressurizing the abdominal cavity against a closed airway, supporting the anterior aspect of the lumbar vertebrae.",
          },
          {
            id: "fit0_q4",
            question: "Which type of mechanical load on the lumbar spine poses the highest risk of acute intervertebral disc herniation?",
            options: ["Pure axial compression in neutral spinal alignment", "Transverse shear stress combined with lumbar flexion and rotation", "Hydrostatic disc fluid pressure", "Tensile erector spinae contraction"],
            correctIndex: 1,
            explanation: "Vertebral discs tolerate pure axial compression remarkably well, but shear stress—particularly when paired with end-range flexion and twisting—causes disc tear and herniation.",
          },
          {
            id: "fit0_q5",
            question: "In the Bench Press, what is the anatomical reason for retracting and depressing the scapulae against the bench?",
            options: [
              "To isolate the serratus anterior",
              "To establish a stable skeletal platform and protect the subacromial space from rotator cuff impingement",
              "To make the barbell travel vertically rather than curved",
              "To ensure the elbows flare to 90 degrees",
            ],
            correctIndex: 1,
            explanation: "Scapular retraction locks the shoulder blades flat against the bench, creating a rigid foundation and opening the subacromial space to prevent supraspinatus tendon pinching.",
          },
          {
            id: "fit0_q6",
            question: "What anatomical point of contact must the barbell line of gravity remain directly over throughout a deadlift or back squat for balanced equilibrium?",
            options: ["The lifter's toes", "The lifter's midfoot", "The lifter's heels", "Behind the ankles"],
            correctIndex: 1,
            explanation: "The midfoot represents the geometric center of the base of support; deviating forward or backward introduces unwanted lever arms and loss of balance.",
          },
          {
            id: "fit0_q7",
            question: "Comparing Conventional and Sumo Deadlifts, what is a primary mechanical advantage of the Sumo stance for lifters with long torsos and short arms?",
            options: [
              "The wide foot stance positions the pelvis closer to the barbell, dramatically reducing the lumbar moment arm",
              "Sumo deadlifts eliminate all quadriceps recruitment",
              "The barbell travels a 50% greater vertical distance",
              "Sumo deadlifts do not require grip strength",
            ],
            correctIndex: 0,
            explanation: "The abducted wide stance places the hips much closer to the barbell along the sagittal plane, shortening the moment arm to the lower back and reducing lumbar shear.",
          },
          {
            id: "fit0_q8",
            question: "What is 'active insufficiency' of a two-joint muscle, such as the rectus femoris during leg extensions?",
            options: [
              "When a muscle runs completely out of ATP molecules",
              "When a bi-articular muscle is shortened across both joints simultaneously and cannot produce maximal contractile force",
              "When lactic acid halts muscle contraction entirely",
              "When the muscle tendon ruptures under shock load",
            ],
            correctIndex: 1,
            explanation: "Active insufficiency occurs when a multi-joint muscle is excessively shortened across both joints, placing actin and myosin in extreme overlap where tension generation drops.",
          },
          {
            id: "fit0_q9",
            question: "What is the optimal path of the barbell in a high-level competitive bench press?",
            options: [
              "A straight vertical line directly over the throat",
              "A shallow J-curve, touching the lower sternum at the bottom and pressing back and up over the glenohumeral joint at lockout",
              "A forward slope touching the belly button",
              "A diagonal trajectory touching the chin",
            ],
            correctIndex: 1,
            explanation: "Because the shoulder joints sit above the lower chest, touching the lower sternum protects the anterior deltoid, while pressing back toward the face aligns the bar over the shoulder joints at lockout.",
          },
          {
            id: "fit0_q10",
            question: "What happens to the moment arm at the knee joint when a lifter allows their knees to travel further forward past the toes in an Olympic front squat?",
            options: [
              "The knee moment arm decreases to zero",
              "The knee moment arm increases, placing higher torque demands on the quadriceps",
              "The hip moment arm doubles in length",
              "The patellar tendon experiences zero tensile force",
            ],
            correctIndex: 1,
            explanation: "Forward knee displacement increases the horizontal distance from the knee joint to the barbell line, increasing the knee moment arm and demanding higher quadriceps torque.",
          },
        ],
      },
    },
    {
      id: "fit_mod_1",
      trackId: "strength",
      subjectKey: "fitness",
      moduleIndex: 1,
      title: "Hypertrophy Programming: Volume Landmarks & Progressive Overload",
      subtitle: "Master Minimum Effective Volume (MEV), Maximum Recoverable Volume (MRV), Reps in Reserve (RIR), and fatigue management.",
      estimatedTime: "30 mins",
      icon: "strength",
      overview:
        "Structure scientifically optimized resistance training programs. Apply volume landmarks (MV, MEV, MAV, MRV), calibrate proximity to muscular failure using RPE/RIR scales, and design systematic deload microcycles.",
      sections: [
        {
          title: "1. The Volume Landmark Continuum (Israetel Model)",
          content: `Muscular adaptation is a dose-dependent response to hard working sets taken close to failure (0–3 RIR):
- **Maintenance Volume (MV)**: The minimum volume required to preserve existing muscle mass (typically 6–8 sets per muscle group weekly).
- **Minimum Effective Volume (MEV)**: The threshold where measurable hypertrophy begins (typically 10–12 sets/week).
- **Maximum Adaptive Volume (MAV)**: The sweet-spot volume range eliciting the greatest rate of muscle gains (typically 14–20 sets/week).
- **Maximum Recoverable Volume (MRV)**: The upper volume ceiling beyond which fatigue outpaces adaptive capacity, causing overreaching and regression (>22–25 sets/week).`,
          example: `Progressive Overload Scheme:
Start a 4-week meso-cycle at MEV (10 sets) and ramp by 2 sets/week toward MAV (16–18 sets) before taking a deload.`,
        },
        {
          title: "2. Proximity to Failure: The RIR & RPE Scale",
          content: `Mechanical tension is the primary driver of hypertrophy. High-threshold motor units (Type II fibers) are only recruited when repetitions approach concentric failure:
- **RIR (Reps in Reserve)**: The number of additional repetitions a lifter could perform with good technique before muscular failure.
  - 3 RIR: 3 reps left in the tank. Excellent for early mesocycle volume accumulation.
  - 1–2 RIR: The hypertrophy sweet spot. High motor unit recruitment with manageable central nervous system fatigue.
  - 0 RIR: True concentric failure. High fatigue cost.`,
          example: `Deload Principle:
Reduce volume by 50% and intensity by 10% for one week to dissipate cumulative systemic fatigue.`,
        },
      ],
      practicalAssignment: {
        id: "fit_assign_1",
        type: "fitness_calculation",
        taskTitle: "Mesocycle Volume Landmark & Deload Architecture",
        instructions:
          "Design a 4-week hypertrophy progression for quadriceps starting at MEV (10 sets) and ramping to MRV with designated RIR targets.",
        promptText:
          "Specify the weekly set volume and target Reps in Reserve (RIR) across Weeks 1 to 4 and the deload protocol.",
        solutionKeywords: ["week 1 10 sets 3 rir", "week 2 12 sets 2 rir", "week 3 15 sets 1 rir", "week 4 18 sets 0 rir", "deload 50% volume"],
        criteria:
          "Appropriate weekly set progression within volume landmarks and accurate RIR deceleration toward failure.",
      },
      assessment: {
        timeLimitSeconds: 600,
        passingScore: 80,
        questions: [
          {
            id: "fit1_q1",
            question: "In hypertrophy science, what does 'Reps in Reserve' (RIR) quantify?",
            options: [
              "The number of repetitions completed in the first set",
              "The estimated number of repetitions a lifter could have performed before hitting concentric muscular failure",
              "The rest duration between sets measured in seconds",
              "The percentage of 1-Rep Max loaded on the bar",
            ],
            correctIndex: 1,
            explanation: "RIR measures how many repetitions short of true concentric failure a set was terminated (e.g. 2 RIR means 2 more reps were possible).",
          },
          {
            id: "fit1_q2",
            question: "What occurs when a lifter consistently trains beyond their Maximum Recoverable Volume (MRV) for multiple weeks?",
            options: [
              "Exponential hypertrophy acceleration",
              "Accumulated systemic fatigue exceeds recovery capacity, leading to regression, strength loss, and overtraining",
              "Body fat decreases to zero percent",
              "Tendon stiffness increases without fatigue",
            ],
            correctIndex: 1,
            explanation: "Surpassing MRV means muscle damage and neurological fatigue exceed the body's rate of protein synthesis and repair, causing negative adaptations.",
          },
          {
            id: "fit1_q3",
            question: "What is the primary cellular driver of skeletal muscle hypertrophy?",
            options: ["Mechanical tension detected by mechanosensors on muscle fibers", "Severe lactic acid accumulation", "Cardiovascular heart rate spikes", "Dehydration of myofibrils"],
            correctIndex: 0,
            explanation: "Mechanical tension—the force exerted by muscle fibers as they contract against heavy resistance near failure—is the primary cellular stimulus for hypertrophy.",
          },
          {
            id: "fit1_q4",
            question: "According to current exercise science literature, what is the optimal weekly set volume per muscle group for most intermediate lifters (MAV)?",
            options: ["1 to 3 sets", "4 to 6 sets", "12 to 20 hard working sets taken close to failure", "50 to 60 sets"],
            correctIndex: 2,
            explanation: "Extensive meta-analyses show that 12 to 20 challenging sets per muscle group per week represents the Maximum Adaptive Volume for the majority of lifters.",
          },
          {
            id: "fit1_q5",
            question: "What is the primary operational purpose of a scheduled 'Deload Week' in an ongoing periodized training block?",
            options: [
              "To completely lose all muscle mass and reset genetics",
              "To dissipate accumulated systemic and connective tissue fatigue while preserving fitness and muscle mass",
              "To test true 1-Rep Maximums on every single exercise",
              "To transition strictly to distance running",
            ],
            correctIndex: 1,
            explanation: "Fitness and fatigue both accumulate over a mesocycle. A deload cuts volume by ~50% to let fatigue drop while preserving adaptations.",
          },
          {
            id: "fit1_q6",
            question: "Under Henneman's Size Principle of motor unit recruitment, when are high-threshold motor units (Type IIx muscle fibers) recruited?",
            options: [
              "Only during low-intensity cardiovascular walking",
              "When lifting heavy loads (>80% 1RM) OR as repetitions approach concentric muscular failure with lighter loads",
              "Strictly during the resting interval between exercises",
              "Only after consuming carbohydrate supplements",
            ],
            correctIndex: 1,
            explanation: "Henneman's Size Principle states motor units are recruited in order of smallest to largest. As fatigue mounts near failure, large Type II fibers must fire.",
          },
          {
            id: "fit1_q7",
            question: "Which repetition range has been shown to produce statistically comparable muscle hypertrophy when sets are matched for proximity to failure (equal RIR)?",
            options: [
              "Strictly 8 to 12 reps only; all other rep ranges produce zero growth",
              "Any rep range between approximately 6 and 30 reps",
              "Only 1 to 3 reps",
              "Exclusively sets exceeding 100 reps",
            ],
            correctIndex: 1,
            explanation: "Research indicates that sets of 6 to 30 reps produce equivalent hypertrophy provided they are performed within 0 to 3 reps of muscular failure.",
          },
          {
            id: "fit1_q8",
            question: "What is the Stimulus-to-Fatigue Ratio (SFR) of an exercise?",
            options: [
              "Barbell weight divided by body weight",
              "The magnitude of muscle hypertrophy stimulus generated relative to the amount of systemic and joint fatigue inflicted",
              "Repetitions divided by heart rate",
              "The ratio of warm-up sets to working sets",
            ],
            correctIndex: 1,
            explanation: "SFR assesses exercise efficiency: exercises with high SFR stimulate great hypertrophy with minimal joint wear and systemic drainage.",
          },
          {
            id: "fit1_q9",
            question: "Why is passive stretching between sets less effective for hypertrophy than loading a muscle at long muscle lengths under tension?",
            options: [
              "Stretching cools down the muscle tissue",
              "Stretch-mediated hypertrophy requires active cross-bridge cycling and mechanical tension at elongated sarcomere lengths",
              "Passive stretching causes instant muscle atrophy",
              "Tendon reflexes prevent muscle protein synthesis",
            ],
            correctIndex: 1,
            explanation: "Stretch-mediated hypertrophy is activated by high mechanical tension generated while titin and sarcomeres are lengthened under active load.",
          },
          {
            id: "fit1_q10",
            question: "In the RPE (Rate of Perceived Exertion) scale based on RIR, what does an RPE of 9.0 correspond to?",
            options: ["The lifter could easily do 5 more reps", "1 Rep in Reserve (1 RIR)", "True failure with zero reps left and technique breakdown", "A light warm-up set"],
            correctIndex: 1,
            explanation: "RPE 10 corresponds to 0 RIR (absolute failure); RPE 9 corresponds to exactly 1 Rep in Reserve.",
          },
        ],
      },
    },
  ],
  nutrition: [
    {
      id: "nut_mod_0",
      trackId: "nutrition",
      subjectKey: "fitness",
      moduleIndex: 0,
      title: "Macronutrient Partitioning, Energy Balance & Metabolic Rate",
      subtitle: "Master the Mifflin-St Jeor equation, Thermic Effect of Food (TEF), and protein synthesis thresholds.",
      estimatedTime: "30 mins",
      icon: "nutrition",
      overview:
        "Understand Total Daily Energy Expenditure (TDEE = BMR + NEAT + TEF + EAT). Calculate optimal protein, carbohydrate, and fat splits for fat loss or lean mass accrual based on metabolic biochemistry.",
      sections: [
        {
          title: "1. Components of Total Daily Energy Expenditure (TDEE)",
          content: `Energy balance dictates changes in body tissue mass according to thermodynamics ($\\Delta E = E_{\\text{in}} - E_{\\text{out}}$):
1. **Basal Metabolic Rate (BMR)** (~60–70% of TDEE): Energy required for baseline autonomic organ function:
$$\\text{BMR (Mifflin-St Jeor)} = 10 \\times \\text{weight (kg)} + 6.25 \\times \\text{height (cm)} - 5 \\times \\text{age (yrs)} + s$$
Where $s = +5$ for males and $s = -161$ for females.
2. **Non-Exercise Activity Thermogenesis (NEAT)** (~15% of TDEE): Unconscious movement (walking, posture, fidgeting).
3. **Thermic Effect of Food (TEF)** (~10% of TDEE): Cost of digesting and metabolizing nutrients:
   - Protein: **20%–30%** of its caloric value burned in digestion!
   - Carbohydrates: **5%–10%**
   - Fats: **0%–3%**
4. **Exercise Activity Thermogenesis (EAT)** (~5%–10% of TDEE): Structured training.`,
          example: `High Protein Satiety Advantage:
A 100 kcal serving of protein requires ~25 kcal solely for enzymatic digestion and processing.`,
        },
        {
          title: "2. Macronutrient Optimization Targets",
          content: `Scientific recommendations for athletes and resistance trainees:
- **Protein**: **1.6 to 2.2 grams per kilogram** of total body weight (or up to $2.4\\text{–}3.0\\text{ g/kg}$ in lean hypocaloric deficits to preserve muscle tissue).
- **Dietary Fat**: Minimum **0.6 to 1.0 g/kg** to maintain endocrine hormone synthesis (testosterone, estrogen) and fat-soluble vitamin absorption (A, D, E, K).
- **Carbohydrates**: Remainder of caloric allocation to support muscle glycogen resynthesis and high-intensity glycolytic output.`,
          example: `For a 75 kg lifter consuming 2500 kcal:
- Protein (2.0 g/kg): 150 g (600 kcal)
- Fat (0.8 g/kg): 60 g (540 kcal)
- Carbs: (2500 - 1140) / 4 = 340 g (1360 kcal).`,
        },
      ],
      practicalAssignment: {
        id: "nut_assign_0",
        type: "fitness_calculation",
        taskTitle: "TDEE & Macronutrient Split Calculator",
        instructions:
          "Calculate BMR, TDEE, a 500 kcal deficit, and target grams of protein, fats, and carbs for an 80 kg male athlete (height 180 cm, age 25, activity factor 1.55).",
        promptText:
          "Compute:\n1. BMR using Mifflin-St Jeor.\n2. Maintenance TDEE with activity factor 1.55.\n3. Fat loss intake at a 500 kcal deficit.\n4. Macro split: Protein at 2.0 g/kg, Fat at 0.8 g/kg, remaining calories to carbohydrates.",
        solutionKeywords: ["bmr 1805", "tdee 2797", "deficit 2297", "protein 160g", "fat 64g", "carbs 270g"],
        criteria:
          "Accurate computation of BMR (~1805 kcal), maintenance TDEE (~2798 kcal), deficit target (~2298 kcal), protein 160 g, fat 64 g, and carbs ~270 g.",
      },
      assessment: {
        timeLimitSeconds: 600,
        passingScore: 80,
        questions: [
          {
            id: "nut0_q1",
            question: "Which component of Total Daily Energy Expenditure (TDEE) accounts for the largest proportion of daily calories in sedentary individuals?",
            options: [
              "Exercise Activity Thermogenesis (EAT)",
              "Basal Metabolic Rate (BMR)",
              "Thermic Effect of Food (TEF)",
              "Excess Post-exercise Oxygen Consumption (EPOC)",
            ],
            correctIndex: 1,
            explanation: "Basal Metabolic Rate accounts for 60% to 70% of total daily energy expenditure in most individuals, supporting vital organ function.",
          },
          {
            id: "nut0_q2",
            question: "Which macronutrient possesses the highest Thermic Effect of Food (TEF), burning 20% to 30% of its caloric value during digestion and assimilation?",
            options: ["Dietary fats", "Simple sugars", "Dietary protein", "Dietary fiber"],
            correctIndex: 2,
            explanation: "Protein has a TEF of 20%–30% because peptide bonds and urea synthesis require significant metabolic energy to process.",
          },
          {
            id: "nut0_q3",
            question: "What is the evidence-based optimal daily protein intake for resistance-trained individuals seeking to maximize muscle protein synthesis?",
            options: ["0.4 to 0.6 g/kg of bodyweight", "0.8 g/kg (RDA baseline)", "1.6 to 2.2 g/kg of bodyweight", "6.0 to 8.0 g/kg of bodyweight"],
            correctIndex: 2,
            explanation: "Systematic reviews conclude that 1.6 to 2.2 g/kg per day maximizes muscle protein synthesis in resistance trainees.",
          },
          {
            id: "nut0_q4",
            question: "Why is a minimum daily dietary fat intake of 0.6 to 1.0 g per kg of bodyweight recommended for athletes?",
            options: [
              "Fats are the only fuel source during 100-meter sprints",
              "Adequate essential fatty acids are required for lipid-based hormone synthesis (e.g., testosterone) and fat-soluble vitamin uptake",
              "Fats directly prevent muscle soreness",
              "Fats contain zero calories",
            ],
            correctIndex: 1,
            explanation: "Severely restricting dietary fats impairs endocrine synthesis of steroid hormones (testosterone, estrogen) and limits absorption of vitamins A, D, E, and K.",
          },
          {
            id: "nut0_q5",
            question: "What amino acid acts as the primary molecular 'trigger' for the mTORC1 pathway that initiates muscle protein synthesis?",
            options: ["L-Arginine", "L-Leucine", "L-Glutamine", "L-Alanine"],
            correctIndex: 1,
            explanation: "Leucine is the primary branched-chain amino acid that directly stimulates the Sestrin2-Rag GTPase sensor to activate mTORC1.",
          },
          {
            id: "nut0_q6",
            question: "What is Non-Exercise Activity Thermogenesis (NEAT)?",
            options: [
              "Calories burned strictly during structured weightlifting sessions",
              "Energy expended for everything we do that is not sleeping, eating, or sports-like exercise (e.g. walking, typing, fidgeting)",
              "Calories burned while digesting protein",
              "Energy used by kidney filtration during deep sleep",
            ],
            correctIndex: 1,
            explanation: "NEAT represents all spontaneous physical activity that is not formal exercise, varying by up to 1,000+ kcal daily between individuals.",
          },
          {
            id: "nut0_q7",
            question: "How many calories are yielded by the metabolism of 1 gram of carbohydrate and 1 gram of dietary fat, respectively?",
            options: ["4 kcal and 9 kcal", "9 kcal and 4 kcal", "4 kcal and 4 kcal", "7 kcal and 9 kcal"],
            correctIndex: 0,
            explanation: "Carbohydrates yield 4 kcal/gram, proteins yield 4 kcal/gram, and fats yield 9 kcal/gram.",
          },
          {
            id: "nut0_q8",
            question: "During a prolonged caloric deficit, what physiological adaptation commonly occurs in thyroid hormone (T3) and leptin levels?",
            options: [
              "T3 and leptin levels increase by 300%",
              "T3 and leptin decrease, slowing metabolic rate and increasing hunger signaling",
              "Metabolic rate doubles automatically",
              "Leptin levels stay completely unaffected",
            ],
            correctIndex: 1,
            explanation: "In a chronic caloric deficit, adaptive thermogenesis down-regulates thyroid T3 conversion and suppresses adipose leptin, driving hunger and reducing expenditure.",
          },
          {
            id: "nut0_q9",
            question: "What is the primary physiological storage site of glycogen in the human body, and can muscle glycogen be released directly into the bloodstream?",
            options: [
              "Adipose tissue only",
              "Skeletal muscle and liver; skeletal muscle lacks glucose-6-phosphatase and cannot release glycogen directly into systemic circulation",
              "The spleen only",
              "Cardiac muscle exclusively",
            ],
            correctIndex: 1,
            explanation: "Muscle and liver store glycogen. Because skeletal muscle lacks glucose-6-phosphatase, it can only consume its glycogen locally for muscular contraction.",
          },
          {
            id: "nut0_q10",
            question: "What is the caloric equivalent of approximately 1 kilogram of human adipose body fat tissue?",
            options: ["1,000 kcal", "3,500 kcal", "7,700 kcal", "15,000 kcal"],
            correctIndex: 2,
            explanation: "Human adipose tissue is ~87% pure lipid along with cellular water and proteins, equating to approximately 7,700 kcal per kilogram (~3,500 kcal per pound).",
          },
        ],
      },
    },
  ],
};

module.exports = { FITNESS_CURRICULUM };
