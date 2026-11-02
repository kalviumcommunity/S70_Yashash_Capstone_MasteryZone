// Comprehensive Language Curriculum Dataset for Mastery Zone
// Tracks: Spanish, English, French, German
// Each module has in-depth instructional content, a practical grammar/translation assignment,
// and exactly 10 proctored assessment MCQs with server-side validation.

const LANGUAGE_CURRICULUM = {
  spanish: [
    {
      id: "es_mod_0",
      trackId: "spanish",
      subjectKey: "language",
      moduleIndex: 0,
      title: "Spanish Fundamentals: Ser vs Estar & Present Verb Morphology",
      subtitle: "Master the fundamental distinction between permanent qualities and transient states, plus regular -ar/-er/-ir conjugations.",
      estimatedTime: "35 mins",
      icon: "spanish",
      overview:
        "Understand Spanish phonetics, gender agreement, pronoun usage, and the crucial distinction between 'Ser' (origin, identity, intrinsic traits) and 'Estar' (location, physical states, emotional conditions).",
      sections: [
        {
          title: "1. The Fundamental Dichotomy: Ser vs Estar",
          content: `In Spanish, the English verb 'to be' splits into two distinct conceptual verbs:
- **SER (DOCTOR)**: Description, Occupation, Characteristic, Time/Date, Origin, Relationship.
  - *Soy de Madrid.* (Origin)
  - *La mesa es de madera.* (Material / Inherent trait)
  - *Son las tres de la tarde.* (Time)
- **ESTAR (PLACE)**: Position, Location, Action (present progressive), Condition, Emotion.
  - *Estoy en la biblioteca.* (Location)
  - *La sopa está fría.* (State/Condition)
  - *Está nublado hoy.* (Weather condition)

Key Nuance: Adjectives can shift meaning entirely depending on the verb:
- *Es listo* = He is clever/smart.
- *Está listo* = He is ready.`,
          example: `Ejemplo:
- Juan es aburrido. (Juan is a boring person.)
- Juan está aburrido. (Juan feels bored right now.)`,
        },
        {
          title: "2. Present Indicative Conjugation Patterns",
          content: `Regular Spanish verbs belong to one of three inflection groups based on their infinitive endings:
- **-AR Verbs (hablar)**: yo hablo, tú hablas, él/ella habla, nosotros hablamos, vosotros habláis, ellos hablan.
- **-ER Verbs (comer)**: yo como, tú comes, él/ella come, nosotros comemos, vosotros coméis, ellos comen.
- **-IR Verbs (vivir)**: yo vivo, tú vives, él/ella vive, nosotros vivimos, vosotros vivís, ellos viven.

Watch out for stem-changing verbs (e -> ie, o -> ue, e -> i) in the boot pattern (yo, tú, él, ellos).`,
          example: `Pensar (e -> ie):
- Pienso, piensas, piensa, pensamos, pensáis, piensan.`,
        },
      ],
      practicalAssignment: {
        id: "es_assign_0",
        type: "grammar_translation",
        taskTitle: "Practical Translation & Ser vs Estar Correction",
        instructions:
          "Translate and correct the following sentences. Submit the structured JSON object containing your translations and chosen auxiliary verbs.",
        promptText:
          "Translate into Spanish:\n1. 'The library is near the central park.' (Use Estar for location)\n2. 'My sister is a doctor and she is very smart.' (Use Ser for occupation and trait)\n3. 'We live in Valencia and we speak Spanish.'",
        solutionKeywords: ["biblioteca", "cerca", "hermana", "médica", "lista", "vivimos", "hablamos"],
        criteria:
          "Accuracy in selecting between Ser and Estar, correct present tense subject-verb agreement, and accurate gender/number noun-adjective agreement.",
      },
      assessment: {
        timeLimitSeconds: 600,
        passingScore: 80,
        questions: [
          {
            id: "es0_q1",
            question: "Which verb correctly completes the sentence: 'El concierto ___ en el estadio nacional'?",
            options: ["está", "es", "hay", "tiene"],
            correctIndex: 1,
            explanation: "When referring to the location where an event takes place (rather than a physical object), 'SER' is required (El concierto es en...).",
          },
          {
            id: "es0_q2",
            question: "What does the sentence 'Elena está aburrida' mean in English?",
            options: [
              "Elena is a boring person.",
              "Elena is bored right now.",
              "Elena is exhausting.",
              "Elena hates reading.",
            ],
            correctIndex: 1,
            explanation: "'Estar aburrido/a' denotes experiencing the temporary state of boredom. 'Ser aburrido/a' means being inherently boring.",
          },
          {
            id: "es0_q3",
            question: "Which of the following forms is the correct 'nosotros' present tense conjugation of 'escribir'?",
            options: ["escribemos", "escribimos", "escribais", "escriben"],
            correctIndex: 1,
            explanation: "-IR verbs conjugate with -imos in the nosotros form (nosotros escribimos).",
          },
          {
            id: "es0_q4",
            question: "In the sentence 'Las manzanas ___ verdes', which verb indicates that the apples are unripe rather than inherently green in variety?",
            options: ["son", "están", "quedan", "hacen"],
            correctIndex: 1,
            explanation: "'Estar verde' indicates the temporary condition of unripeness. 'Ser verde' implies the apple is of a green variety (like Granny Smith).",
          },
          {
            id: "es0_q5",
            question: "Which is the irregular 'yo' form of the verb 'conocer' (to know / be acquainted with)?",
            options: ["conozo", "conozco", "conoco", "conoci"],
            correctIndex: 1,
            explanation: "Verbs ending in vowel + cer/cir typically take -zco in the first person singular present: yo conozco.",
          },
          {
            id: "es0_q6",
            question: "How do you say 'It is cold today' in idiomatic Spanish regarding weather?",
            options: ["Es frío hoy.", "Está frío hoy.", "Hace frío hoy.", "Tiene frío hoy."],
            correctIndex: 2,
            explanation: "Weather phenomena in Spanish are customarily described using the verb 'hacer' (Hace frío, Hace calor, Hace viento).",
          },
          {
            id: "es0_q7",
            question: "Which pronoun correctly replaces the direct object in: 'Carlos compra el libro'?",
            options: ["Carlos lo compra.", "Carlos le compra.", "Carlos se compra.", "Carlos la compra."],
            correctIndex: 0,
            explanation: "'El libro' is masculine singular direct object, replaced by the direct object pronoun 'lo'.",
          },
          {
            id: "es0_q8",
            question: "What is the stem change pattern for the verb 'dormir' in the present indicative for 'tú'?",
            options: ["tú dormes", "tú duermes", "tú durmes", "tú diermes"],
            correctIndex: 1,
            explanation: "'Dormir' undergoes an o -> ue diphthongization in the present indicative: yo duermo, tú duermes, él duerme, ellos duermen.",
          },
          {
            id: "es0_q9",
            question: "Which preposition must follow the verb 'aprender' when followed by an infinitive?",
            options: ["de", "en", "a", "por"],
            correctIndex: 2,
            explanation: "'Aprender a + infinitive' (e.g., 'Aprendo a hablar español') is the required prepositional complement.",
          },
          {
            id: "es0_q10",
            question: "What is the correct form of the definite article for the feminine noun 'agua' in the singular, and why?",
            options: [
              "La agua, because it is feminine.",
              "El agua, to avoid phonetic cacophony with the stressed initial 'a'.",
              "Un agua, definite articles cannot be used with water.",
              "Le agua, borrowed from French.",
            ],
            correctIndex: 1,
            explanation: "Feminine singular nouns beginning with a stressed 'a' or 'ha' take the masculine article 'el' in the singular (el agua, el águila) to prevent vowel clash, though adjectives remain feminine (el agua fría).",
          },
        ],
      },
    },
    {
      id: "es_mod_1",
      trackId: "spanish",
      subjectKey: "language",
      moduleIndex: 1,
      title: "Spanish Narrative Past: Pretérito Indefinido vs Imperfecto",
      subtitle: "Master the narrative past aspect: completed actions with boundaries vs ongoing, background, or habitual actions.",
      estimatedTime: "40 mins",
      icon: "spanish",
      overview:
        "Contrast the Spanish preterite and imperfect aspects to construct sophisticated narratives, distinguish completed milestones from habitual routines, and master irregular preterite root changes.",
      sections: [
        {
          title: "1. The Pretérito Indefinido (Completed Action)",
          content: `The preterite views an action from the outside as a completed whole with defined chronological boundaries (beginning or end):
- Trigger words: *ayer, anoche, el año pasado, de repente, una vez*.
- Endings for -AR: -é, -aste, -ó, -amos, -asteis, -aron.
- Endings for -ER/-IR: -í, -iste, -ió, -imos, -isteis, -ieron.
- Irregular roots (UV, U, I roots): *tener -> tuv-*, *estar -> estuv-*, *poner -> pus-*, *hacer -> hic- (hizo)*.`,
          example: `Ejemplo:
- Ayer caminé tres kilómetros y compré un libro. (Sequence of discrete completed events.)`,
        },
        {
          title: "2. The Pretérito Imperfecto (Ongoing / Habitual)",
          content: `The imperfect views an action from within, without concern for its beginning or end:
- Continuous background action (*Hacía sol cuando salí*).
- Habitual or recurring past habits (*Siempre jugábamos en el parque*).
- Physical, mental, or emotional states in the past (*Tenía miedo*).
- Only three irregular verbs exist in the imperfect: *ser (era)*, *ir (iba)*, and *ver (veía)*.`,
          example: `Ejemplo:
- Cuando era niño, vivía en Sevilla. (Habitual context / background condition.)`,
        },
      ],
      practicalAssignment: {
        id: "es_assign_1",
        type: "grammar_translation",
        taskTitle: "Narrative Past Aspect Selection",
        instructions:
          "Analyze the narrative scenario and provide the correct forms of the verbs in either preterite or imperfect based on narrative aspect.",
        promptText:
          "Fill in the blanks with the correct form of the verb in parentheses:\n'Ayer, mientras yo (estudiar) en la sala, de repente (sonar) el teléfono. Mi madre (estar) cansada porque (trabajar) toda la noche.'",
        solutionKeywords: ["estudiaba", "sonó", "estaba", "había trabajado", "trabajó"],
        criteria:
          "Correct identification of simultaneous background activity (imperfect) interrupted by a punctual completed action (preterite).",
      },
      assessment: {
        timeLimitSeconds: 600,
        passingScore: 80,
        questions: [
          {
            id: "es1_q1",
            question: "Which tense should be used for the ongoing background action in: 'Mientras nosotros ___ la cena, se fue la luz'?",
            options: ["preparábamos (imperfecto)", "preparamos (pretérito)", "preparáramos (subjuntivo)", "habíamos preparado (pluscuamperfecto)"],
            correctIndex: 0,
            explanation: "'Mientras' introduces simultaneous ongoing background actions in the past, demanding the imperfect (preparábamos).",
          },
          {
            id: "es1_q2",
            question: "What is the third-person singular preterite form of the irregular verb 'hacer'?",
            options: ["hació", "hizo", "hicó", "hacé"],
            correctIndex: 1,
            explanation: "'Hacer' has the irregular preterite stem 'hic-', but changes 'c' to 'z' before 'o' in the 3rd person singular to preserve the /s/ or /θ/ sound: él/ella hizo.",
          },
          {
            id: "es1_q3",
            question: "How does the meaning of the verb 'conocer' change when used in the preterite rather than the imperfect?",
            options: [
              "In preterite it means 'to meet for the first time'; in imperfect it means 'knew/was acquainted with'.",
              "In preterite it means 'to forget'; in imperfect it means 'to recognize'.",
              "There is no change in meaning.",
              "In preterite it means 'to understand'; in imperfect it means 'to study'.",
            ],
            correctIndex: 0,
            explanation: "Conocer in the preterite denotes the punctual milestone of initial meeting: 'Conocí a María ayer' (I met Maria yesterday).",
          },
          {
            id: "es1_q4",
            question: "Which of the following verbs is completely irregular in the imperfect indicative?",
            options: ["estar", "tener", "ir", "querer"],
            correctIndex: 2,
            explanation: "Only three verbs are irregular in the imperfect: ser (era), ir (iba), and ver (veía). All other verbs are strictly regular.",
          },
          {
            id: "es1_q5",
            question: "Complete the sentence correctly: 'El año pasado, mis abuelos ___ a Japón.'",
            options: ["viajaban", "viajaron", "viajan", "hayan viajado"],
            correctIndex: 1,
            explanation: "'El año pasado' specifies a completed time period, indicating a punctual completed action that requires the preterite (viajaron).",
          },
          {
            id: "es1_q6",
            question: "What is the first person singular preterite form of 'buscar'?",
            options: ["busqué", "busque", "buscé", "buscí"],
            correctIndex: 0,
            explanation: "Verbs ending in -car undergo an orthographic shift to -qué in the first person singular preterite to preserve the hard /k/ sound: yo busqué.",
          },
          {
            id: "es1_q7",
            question: "What does 'Saber' mean when used in the preterite tense: 'Ayer supe la verdad'?",
            options: ["I knew the truth for years", "I found out / learned the truth", "I forgot the truth", "I doubted the truth"],
            correctIndex: 1,
            explanation: "'Saber' in the preterite denotes the point in time when knowledge was acquired (to find out / discover).",
          },
          {
            id: "es1_q8",
            question: "Which sentence expresses an interrupted past action correctly?",
            options: [
              "Yo dormí cuando mi amigo llamó.",
              "Yo dormía cuando mi amigo llamó.",
              "Yo dormí cuando mi amigo llamaba.",
              "Yo dormía cuando mi amigo llamaba.",
            ],
            correctIndex: 1,
            explanation: "The ongoing action takes the imperfect (dormía), and the interrupting punctual event takes the preterite (llamó).",
          },
          {
            id: "es1_q9",
            question: "What is the preterite conjugation of 'decir' for 'ellos/ellas'?",
            options: ["dijieron", "dijeron", "decieron", "dijaron"],
            correctIndex: 1,
            explanation: "J-stem preterite verbs (decir -> dij-, traer -> traj-) drop the 'i' in the third-person plural ending: ellos dijeron (not dijieron).",
          },
          {
            id: "es1_q10",
            question: "Which form completes the habitual past statement: 'De niños, siempre ___ al fútbol los domingos'?",
            options: ["jugamos", "jugábamos", "jugaron", "habíamos jugado"],
            correctIndex: 1,
            explanation: "Habitual or customary repeated actions in the past are expressed with the imperfect: jugábamos.",
          },
        ],
      },
    },
  ],
  english: [
    {
      id: "en_mod_0",
      trackId: "english",
      subjectKey: "language",
      moduleIndex: 0,
      title: "Advanced English Syntax, Conditionals & Subjunctive Mood",
      subtitle: "Deconstruct hypothetical scenarios across Zero through Third and Mixed conditionals, plus formal mandative subjunctive.",
      estimatedTime: "30 mins",
      icon: "english",
      overview:
        "Master the structural mechanics of complex English clauses, counterfactual conditionals, inverted conditionals (Had I known...), and the mandative subjunctive in formal and professional prose.",
      sections: [
        {
          title: "1. Taxonomy of English Conditionals",
          content: `Conditionals relate hypothetical circumstances to predicted or actual consequences:
- **Zero Conditional**: Universal truths / scientific certainty.
  - *If you heat ice, it melts.* (Present simple + present simple)
- **First Conditional**: Real, probable future outcomes.
  - *If she arrives on time, we will commence the presentation.* (Present simple + modal will/can)
- **Second Conditional**: Hypothetical, counterfactual present/future states.
  - *If I were the CEO, I would invest in sustainable infrastructure.* (Past simple [were] + would/could + infinitive)
- **Third Conditional**: Counterfactual past events and missed opportunities.
  - *If they had deployed the patch earlier, the system would not have collapsed.* (Past perfect + would have + past participle)
- **Mixed Conditionals**: Connecting a counterfactual past action to a present consequence.
  - *If I had accepted that offer, I would be living in London today.*`,
          example: `Inverted Formal Conditionals:
- "Had we anticipated the surge, we would have provisioned extra servers." (Omits 'if' via subject-auxiliary inversion).`,
        },
        {
          title: "2. The Mandative Subjunctive in Professional Prose",
          content: `English retains the subjunctive mood for formal demands, recommendations, and urgency. It utilizes the bare infinitive regardless of the subject person or number:
- Trigger verbs: *demand, insist, mandate, recommend, suggest, urge, require*.
- Trigger adjectives: *vital, imperative, crucial, essential*.
- Formula: *It is essential that [subject] [bare verb]*.
  - *The committee recommended that the CFO **step** down immediately.* (Not 'steps').
  - *It is imperative that every developer **be** familiar with cryptographic standards.* (Not 'is').`,
          example: `Correct: The protocol requires that he sign the disclosure.
Incorrect: The protocol requires that he signs the disclosure.`,
        },
      ],
      practicalAssignment: {
        id: "en_assign_0",
        type: "grammar_translation",
        taskTitle: "Conditional & Subjunctive Clause Restructuring",
        instructions:
          "Rewrite the sentences using inverted conditional structures and the mandative subjunctive as specified in the prompt.",
        promptText:
          "1. Invert without 'if': 'If the team had verified the dataset, the anomaly would not have propagated.'\n2. Rewrite using mandative subjunctive: 'The lead engineer insists that Sarah must update the schema.'",
        solutionKeywords: ["had the team verified", "insists that Sarah update", "would not have propagated"],
        criteria:
          "Correct syntax inversion without auxiliary errors, and correct bare infinitive selection in the subjunctive clause.",
      },
      assessment: {
        timeLimitSeconds: 600,
        passingScore: 80,
        questions: [
          {
            id: "en0_q1",
            question: "Which sentence correctly demonstrates the mandative subjunctive mood?",
            options: [
              "The auditor insisted that the accountant reviews all ledgers.",
              "The auditor insisted that the accountant review all ledgers.",
              "The auditor insisted that the accountant reviewed all ledgers.",
              "The auditor insisted that the accountant should be reviewing all ledgers.",
            ],
            correctIndex: 1,
            explanation: "The mandative subjunctive requires the bare infinitive (review) regardless of the third-person singular subject.",
          },
          {
            id: "en0_q2",
            question: "Which of the following is an inverted equivalent of: 'If you should require any assistance, please notify security'?",
            options: [
              "Should you require any assistance, please notify security.",
              "Did you require any assistance, please notify security.",
              "Were you requiring any assistance, please notify security.",
              "Had you required any assistance, please notify security.",
            ],
            correctIndex: 0,
            explanation: "First conditional inversion with 'should' shifts 'Should' to the head of the clause, omitting 'if'.",
          },
          {
            id: "en0_q3",
            question: "Identify the Mixed Conditional connecting a counterfactual past condition with a present outcome:",
            options: [
              "If she studied harder, she would pass the exam tomorrow.",
              "If they had taken that flight, they would be attending the symposium right now.",
              "If we have enough time, we will visit the gallery.",
              "If you heat water to 100 degrees Celsius, it boils.",
            ],
            correctIndex: 1,
            explanation: "'If they had taken' (past counterfactual) + 'they would be attending... right now' (present continuous consequence) is a textbook mixed conditional.",
          },
          {
            id: "en0_q4",
            question: "In standard formal English, what is the preferred subjunctive form in: 'If I ___ in your position, I would renegotiate the contract'?",
            options: ["was", "were", "am", "be"],
            correctIndex: 1,
            explanation: "In standard formal English, the irrealis subjunctive 'were' is preferred for all persons in counterfactual second conditionals.",
          },
          {
            id: "en0_q5",
            question: "Select the correctly punctuated sentence featuring a non-restrictive relative clause:",
            options: [
              "The laptop that has the cracked screen belongs to Marcus.",
              "The laptop, which has the cracked screen, belongs to Marcus.",
              "The laptop which has the cracked screen belongs to Marcus.",
              "The laptop, that has the cracked screen, belongs to Marcus.",
            ],
            correctIndex: 1,
            explanation: "Non-restrictive relative clauses provide supplemental information, require 'which' (never 'that'), and must be enclosed in commas.",
          },
          {
            id: "en0_q6",
            question: "What grammatical anomaly is present in: 'Running toward the gate, the departure bell rang loudly'?",
            options: ["Split infinitive", "Dangling participle", "Comma splice", "Fused sentence"],
            correctIndex: 1,
            explanation: "The participial phrase 'Running toward the gate' modifies 'the departure bell' rather than the human runner, creating a dangling participle.",
          },
          {
            id: "en0_q7",
            question: "Which sentence features correct correlative conjunction parallelism?",
            options: [
              "She not only enjoyed the lecture but also the following panel discussion.",
              "She enjoyed not only the lecture but also the following panel discussion.",
              "She not only enjoyed the lecture but the following panel discussion was enjoyable too.",
              "Not only she enjoyed the lecture, but also attended the panel.",
            ],
            correctIndex: 1,
            explanation: "Correlative conjunctions must balance identical syntactic units; 'not only [noun phrase] but also [noun phrase]' maintains strict parallelism.",
          },
          {
            id: "en0_q8",
            question: "What is the inverted form of: 'If he had been informed of the delay, he would have rescheduled'?",
            options: [
              "Had he been informed of the delay, he would have rescheduled.",
              "Was he informed of the delay, he would have rescheduled.",
              "Should he be informed of the delay, he would have rescheduled.",
              "Were he informed of the delay, he would have rescheduled.",
            ],
            correctIndex: 0,
            explanation: "Third conditional inversion places the auxiliary 'Had' first, eliminating 'if'.",
          },
          {
            id: "en0_q9",
            question: "Which of the following modal idioms expresses logical deduction regarding a past event with high certainty?",
            options: ["She might have arrived.", "She must have arrived.", "She could have arrived.", "She would have arrived."],
            correctIndex: 1,
            explanation: "'Must have + past participle' communicates an affirmative epistemic deduction based on compelling evidence.",
          },
          {
            id: "en0_q10",
            question: "Complete the sentence with the correct subjunctive form: 'The judge ordered that the defendant ___ in custody.'",
            options: ["remains", "remained", "remain", "will remain"],
            correctIndex: 2,
            explanation: "Following the trigger verb 'ordered that', the mandative subjunctive takes the base form: remain.",
          },
        ],
      },
    },
    {
      id: "en_mod_1",
      trackId: "english",
      subjectKey: "language",
      moduleIndex: 1,
      title: "Idiomatic Precision, Phrasal Verbs & Discourse Cohesion",
      subtitle: "Elevate rhetorical fluency with separable vs inseparable phrasal verbs, lexical collocations, and cohesive discourse markers.",
      estimatedTime: "35 mins",
      icon: "english",
      overview:
        "Develop executive-level conversational and professional nuance through mastery of multi-word verbs, idiomatic collocations, and rhetorical transitions that ensure crystalline structural coherence.",
      sections: [
        {
          title: "1. Mechanics of Phrasal Verbs: Separability & Transitivity",
          content: `Phrasal verbs consist of a base verb combined with a preposition or adverbial particle:
- **Intransitive** (No object): *break down, show up, pass out*.
  - *The legacy build pipeline broke down overnight.*
- **Separable Transitive**: Object can sit between verb and particle, BUT a pronoun object MUST be placed between:
  - *Turn off the server* OR *Turn the server off*.
  - *Turn it off* (NEVER *Turn off it*).
- **Inseparable Transitive**: The object must follow the particle:
  - *Look into the bug* (NEVER *Look the bug into*).
  - *Come across an anomaly* (NEVER *Come an anomaly across*).
- **Three-part Phrasal Verbs**: Always inseparable: *come up with, cut down on, look forward to, put up with*.`,
          example: `Correct: He looked up the documentation. / He looked it up.
Incorrect: He looked up it.`,
        },
        {
          title: "2. Rhetorical Markers & Discourse Flow",
          content: `Sophisticated discourse relies on transitions that delineate nuanced semantic relationships:
- **Concession**: *Notwithstanding, albeit, even so, whereas*.
- **Causality & Inference**: *Consequently, hence, thereby (+ present participle)*.
  - *The encryption key was rotated, thereby preventing unauthorized decryption.*
- **Contrast**: *Conversely, on the contrary, in stark contrast*.`,
          example: `The redesign achieved superior performance, albeit at the expense of prolonged development timelines.`,
        },
      ],
      practicalAssignment: {
        id: "en_assign_1",
        type: "grammar_translation",
        taskTitle: "Phrasal Verb & Transition Precision Assignment",
        instructions:
          "Replace informal vernacular with idiomatic executive collocations and correctly structure separable phrasal pronouns in the provided paragraph.",
        promptText:
          "Refactor this paragraph:\n'We need to think of a new plan because the server shut down. The engineer checked it out and figured out it was out of memory. We should lower our memory usage.'",
        solutionKeywords: ["come up with", "checked it out", "figured out", "curtail", "cut down on"],
        criteria:
          "Proper pronoun insertion inside separable verbs and application of advanced cohesive markers.",
      },
      assessment: {
        timeLimitSeconds: 600,
        passingScore: 80,
        questions: [
          {
            id: "en1_q1",
            question: "Which sentence demonstrates the correct placement of a pronoun object with a separable phrasal verb?",
            options: [
              "Please look up it in the dictionary.",
              "Please look it up in the dictionary.",
              "Please look in it up the dictionary.",
              "Please look up into it in the dictionary.",
            ],
            correctIndex: 1,
            explanation: "When the direct object of a separable phrasal verb is a personal pronoun, it MUST be placed between the verb and the particle: look it up.",
          },
          {
            id: "en1_q2",
            question: "What is the meaning of the three-part phrasal verb 'to make up for'?",
            options: ["To invent a deceptive narrative", "To compensate for a deficiency or loss", "To reconcile after a conflict", "To assemble components"],
            correctIndex: 1,
            explanation: "'To make up for' means to compensate for (e.g., 'He worked overtime to make up for lost time').",
          },
          {
            id: "en1_q3",
            question: "Choose the discourse marker that expresses concession followed by a subordinate clause or adjective phrase without a finite verb:",
            options: ["consequently", "albeit", "furthermore", "inasmuch as"],
            correctIndex: 1,
            explanation: "'Albeit' introduces a concessive clause or modifier without a main verb (e.g., 'an impressive albeit costly solution').",
          },
          {
            id: "en1_q4",
            question: "Which of the following verbs is an inseparable transitive phrasal verb?",
            options: ["call off (cancel)", "run into (encounter unexpectedly)", "turn down (reject)", "give up (relinquish)"],
            correctIndex: 1,
            explanation: "'Run into' is inseparable: one says 'I ran into him', never 'I ran him into'. Call off, turn down, and give up are separable.",
          },
          {
            id: "en1_q5",
            question: "Select the natural, native lexical collocation:",
            options: ["commit a mistake", "make a crime", "make a mistake", "do a crime"],
            correctIndex: 2,
            explanation: "The established natural English collocations are 'make a mistake' and 'commit a crime'.",
          },
          {
            id: "en1_q6",
            question: "What does the idiom 'to cut corners' denote in an engineering or business context?",
            options: [
              "To streamline geometry in CAD software",
              "To perform a task improperly or unsafely to economize time or money",
              "To change course abruptly",
              "To exceed quarterly revenue targets",
            ],
            correctIndex: 1,
            explanation: "'To cut corners' means sacrificing standards, safety, or thoroughness to save resources.",
          },
          {
            id: "en1_q7",
            question: "Complete the sentence with the correct transition: 'The initial prototype failed; ___, the data yielded critical insights.'",
            options: ["moreover", "nonetheless", "therefore", "similarly"],
            correctIndex: 1,
            explanation: "'Nonetheless' signals an adversative contrast/concession despite the failure mentioned in the preceding clause.",
          },
          {
            id: "en1_q8",
            question: "Identify the sentence that correctly utilizes 'thereby':",
            options: [
              "We encrypted the database, thereby securing confidential client records.",
              "We encrypted the database, thereby we secured records.",
              "Thereby the database was encrypted, we secured records.",
              "We encrypted the database thereby to secure records.",
            ],
            correctIndex: 0,
            explanation: "'Thereby' is conventionally followed by a gerund-participle clause expressing the consequential result of the primary action.",
          },
          {
            id: "en1_q9",
            question: "What does the phrasal verb 'to boil down to' signify?",
            options: [
              "To evaporate liquid over high heat",
              "To constitute the fundamental, essential element of an issue",
              "To degrade into an angry altercation",
              "To reduce operational personnel",
            ],
            correctIndex: 1,
            explanation: "'To boil down to' means that a complex situation can be summarized by its single most essential cause or attribute.",
          },
          {
            id: "en1_q10",
            question: "Which of the following phrases correctly employs the subjunctive formula 'be that as it may'?",
            options: [
              "Be that as it is, we must proceed.",
              "Be that as it may, we must proceed.",
              "Being that as it may, we must proceed.",
              "Be that as it would, we must proceed.",
            ],
            correctIndex: 1,
            explanation: "'Be that as it may' is an archaic fixed subjunctive idiom meaning 'nevertheless' or 'regardless of that fact'.",
          },
        ],
      },
    },
  ],
  french: [
    {
      id: "fr_mod_0",
      trackId: "french",
      subjectKey: "language",
      moduleIndex: 0,
      title: "French Core Architecture: Passé Composé vs Imparfait & Auxiliary Selection",
      subtitle: "Deconstruct completed events with Avoir and Être auxiliaries, participle agreement rules, and background description in l'Imparfait.",
      estimatedTime: "35 mins",
      icon: "french",
      overview:
        "Master the foundational dichotomy of French past narrative: the compound past (Passé Composé) for bounded historical events and the imperfect (Imparfait) for ongoing background conditions and habits.",
      sections: [
        {
          title: "1. Auxiliary Selection: Avoir vs Être (DR MRS VANDERTRAMP)",
          content: `Most French verbs form the Passé Composé with **Avoir** + Past Participle (*J'ai mangé*).
However, a specific closed class of verbs denoting movement or state change, along with ALL reflexive/pronominal verbs, require **Être**:
- Devenir, Revenir, Monter, Rester, Sortir, Venir, Aller, Naître, Descendre, Entrer, Rentrer, Tomber, Retourner, Arriver, Mourir, Partir.
- Pronominal verbs: *Je me suis levé(e)*.

Crucial Participle Agreement Rule:
- With **Être**, the past participle agrees in gender (-e) and number (-s) with the subject: *Elles sont allées à Paris.*
- With **Avoir**, the past participle only agrees if a direct object precedes the verb: *Les pommes que j'ai mangées.*`,
          example: `Subject Agreement with Être:
- Marie est partie ce matin.
- Ils sont arrivés hier soir.`,
        },
        {
          title: "2. The Imparfait for Scenery & Habitual Behavior",
          content: `Formed by taking the present tense 'nous' stem and appending: -ais, -ais, -ait, -ions, -iez, -aient.
- Habitual childhood memories (*Quand j'étais petit, je lisais tous les jours*).
- Physical states, age, feelings, and atmospheric conditions (*Il faisait froid*).
- Simultaneous backdrop interrupted by a sudden action (*Je dormais quand le téléphone a sonné*).`,
          example: `Nous parlons -> stem 'parl-' -> je parlais, nous parlions, ils parlaient.`,
        },
      ],
      practicalAssignment: {
        id: "fr_assign_0",
        type: "grammar_translation",
        taskTitle: "Auxiliary Selection & Participle Agreement Challenge",
        instructions:
          "Provide the correct auxiliary (avoir or être) and appropriate participle agreement for the sentences in the prompt.",
        promptText:
          "Complete the sentences:\n1. 'Elles (aller) au cinéma hier.'\n2. 'La lettre que Paul (écrire) est sur la table.'\n3. 'Hier matin, il (faire) beau, alors nous (décider) de sortir.'",
        solutionKeywords: ["sont allées", "a écrite", "faisait", "avons décidé"],
        criteria:
          "Accurate selection between Avoir and Être, feminine plural agreement on allées, and feminine singular agreement with the preceding direct object que.",
      },
      assessment: {
        timeLimitSeconds: 600,
        passingScore: 80,
        questions: [
          {
            id: "fr0_q1",
            question: "Which auxiliary verb is required to conjugate 'naître' in the passé composé?",
            options: ["avoir", "être", "faire", "aller"],
            correctIndex: 1,
            explanation: "'Naître' (to be born) is an intransitive verb of state change in the DR MRS VANDERTRAMP list and takes 'être' (Il est né).",
          },
          {
            id: "fr0_q2",
            question: "Choose the sentence with the correct past participle agreement:",
            options: [
              "Les fleurs qu'il a acheté sont magnifiques.",
              "Les fleurs qu'il a achetées sont magnifiques.",
              "Les fleurs qu'il a achetés sont magnifiques.",
              "Les fleurs qu'il a achetez sont magnifiques.",
            ],
            correctIndex: 1,
            explanation: "With 'avoir', the past participle agrees with a preceding direct object. 'Les fleurs' (feminine plural) precedes via 'que', requiring 'achetées'.",
          },
          {
            id: "fr0_q3",
            question: "What is the imparfait stem of the irregular verb 'être'?",
            options: ["somm-", "ét-", "soi-", "ser-"],
            correctIndex: 1,
            explanation: "'Être' is the sole verb with an irregular imparfait stem, using 'ét-' (j'étais, tu étais, il était).",
          },
          {
            id: "fr0_q4",
            question: "In the sentence 'Quand nous habitions à Lyon, nous ___ au marché chaque samedi', which form is appropriate?",
            options: ["allions", "sommes allés", "allâmes", "ayons été"],
            correctIndex: 0,
            explanation: "Habitual, repetitive past actions occurring 'chaque samedi' demand the imperfect: allions.",
          },
          {
            id: "fr0_q5",
            question: "Which of the following sentences correctly conjugates a reflexive verb for a feminine subject in the passé composé?",
            options: [
              "Sophie s'est réveillé à huit heures.",
              "Sophie s'est réveillée à huit heures.",
              "Sophie a réveillé à huit heures.",
              "Sophie est se réveillée à huit heures.",
            ],
            correctIndex: 1,
            explanation: "Reflexive verbs take 'être' as auxiliary and the participle agrees with the reflexive pronoun direct object: Sophie s'est réveillée.",
          },
          {
            id: "fr0_q6",
            question: "What happens to the meaning of 'descendre' when used with 'avoir' instead of 'être'?",
            options: [
              "It becomes reflexive.",
              "It changes from 'to go down' to taking a direct object 'to bring down / take down'.",
              "It expresses a future possibility.",
              "It is grammatically illegal in standard French.",
            ],
            correctIndex: 1,
            explanation: "Verbs like descendre, monter, sortir take 'avoir' when used transitively with a direct object: 'J'ai descendu les valises' (I brought down the suitcases).",
          },
          {
            id: "fr0_q7",
            question: "What is the correct negative placement for 'ne... jamais' in the passé composé?",
            options: [
              "Je n'ai vu jamais ce film.",
              "Je n'ai jamais vu ce film.",
              "Je ne jamais ai vu ce film.",
              "Je jamais n'ai vu ce film.",
            ],
            correctIndex: 1,
            explanation: "In compound tenses, negative adverbs like pas, jamais, and rien are placed between the auxiliary and the participle: n'ai jamais vu.",
          },
          {
            id: "fr0_q8",
            question: "How is weather in the past typically expressed when setting a scene in a story?",
            options: [
              "Il a fait mauvais temps.",
              "Il faisait mauvais temps.",
              "Il est fait mauvais temps.",
              "Il ferait mauvais temps.",
            ],
            correctIndex: 1,
            explanation: "Descriptive background weather that frames a narrative takes the imperfect: Il faisait mauvais temps.",
          },
          {
            id: "fr0_q9",
            question: "What is the past participle of the irregular verb 'prendre'?",
            options: ["prendu", "pris", "pri", "prenu"],
            correctIndex: 1,
            explanation: "The past participle of 'prendre' is 'pris' (j'ai pris, tu as pris).",
          },
          {
            id: "fr0_q10",
            question: "Choose the correct translation: 'She broke her arm.'",
            options: [
              "Elle a cassé son bras.",
              "Elle s'est cassé le bras.",
              "Elle s'est cassée le bras.",
              "Elle est cassée son bras.",
            ],
            correctIndex: 1,
            explanation: "In French, body parts injured reflexively take the definite article 'le/la', and the participle does not agree because the body part is the direct object following the verb: Elle s'est cassé le bras.",
          },
        ],
      },
    },
  ],
  german: [
    {
      id: "de_mod_0",
      trackId: "german",
      subjectKey: "language",
      moduleIndex: 0,
      title: "German Grammatical Cases: Nominativ, Akkusativ, Dativ & Genitiv",
      subtitle: "Deconstruct the four German cases, definite/indefinite article declensions, and two-way prepositions (Wechselpräpositionen).",
      estimatedTime: "40 mins",
      icon: "german",
      overview:
        "Master the declension tables governing German articles and adjectives across all four cases, understand thematic roles (subject, direct object, indirect recipient, possessor), and master spatial vs directional prepositions.",
      sections: [
        {
          title: "1. The Four Grammatical Cases & Article Matrix",
          content: `In German, the grammatical function of a noun phrase is signaled through morphological case endings on articles and adjectives:
- **Nominativ (Subject)**: The agent performing the verb.
  - Masculine: *der / ein*
  - Feminine: *die / eine*
  - Neuter: *das / ein*
  - Plural: *die / keine*
- **Akkusativ (Direct Object)**: The entity directly acted upon. Only the masculine shifts!
  - Masculine: *den / einen*
  - Feminine: *die / eine*
  - Neuter: *das / ein*
  - Plural: *die / keine*
- **Dativ (Indirect Object / Recipient)**: The benefactor or target of action.
  - Masculine: *dem / einem*
  - Feminine: *der / einer*
  - Neuter: *dem / einem*
  - Plural: *den (+ -n on noun) / keinen*
- **Genitiv (Possession / Origin)**:
  - Masculine/Neuter: *des (+ -(e)s on noun) / eines*
  - Feminine/Plural: *der / einer*`,
          example: `Example:
Der Mann (Nom) gibt der Frau (Dat) den Schlüssel (Akk) des Hauses (Gen).
(The man gives the woman the key of the house.)`,
        },
        {
          title: "2. Wechselpräpositionen (Two-Way Prepositions)",
          content: `Nine prepositions can govern EITHER the Akkusativ or the Dativ depending on the spatial aspect:
*an, auf, hinter, in, neben, über, unter, vor, zwischen*.
- **Akkusativ (Wohin? - Direction / Movement toward a destination)**:
  - *Ich stelle das Buch auf den Tisch.* (Action: putting it onto the table).
- **Dativ (Wo? - Fixed Location / Static position)**:
  - *Das Buch liegt auf dem Tisch.* (State: lying on the table).`,
          example: `Directional: Er geht in die Schule (Akk).
Static location: Er lernt in der Schule (Dat).`,
        },
      ],
      practicalAssignment: {
        id: "de_assign_0",
        type: "grammar_translation",
        taskTitle: "Case Declension & Two-Way Preposition Drill",
        instructions:
          "Supply the correct declined definite articles (der, die, das, den, dem, des) for each noun based on its case role.",
        promptText:
          "Fill in the blanks with the correct definite article:\n1. 'Der Hund folgt ___ (die) Katze.' (folgen governs Dative)\n2. 'Ich lege das Smartphone auf ___ (der) Schreibtisch.' (Directional -> Akkusativ)\n3. 'Das ist das Auto ___ (der) Lehrers.' (Genitive)",
        solutionKeywords: ["der Katze", "den Schreibtisch", "des Lehrers"],
        criteria:
          "Proper identification of dative governing verbs, directional two-way preposition usage, and genitive masculine article inflection.",
      },
      assessment: {
        timeLimitSeconds: 600,
        passingScore: 80,
        questions: [
          {
            id: "de0_q1",
            question: "Which case is required by the verb 'helfen' (to help) for its object?",
            options: ["Nominativ", "Akkusativ", "Dativ", "Genitiv"],
            correctIndex: 2,
            explanation: "'Helfen' is a dative verb in German: 'Ich helfe dem Mann' (not den Mann).",
          },
          {
            id: "de0_q2",
            question: "In the sentence 'Das Bild hängt an ___ Wand', what is the correct article if the picture is already hanging there (static location)?",
            options: ["die (Akkusativ)", "der (Dativ)", "den (Dativ Plural)", "des (Genitiv)"],
            correctIndex: 1,
            explanation: "'Hängen' indicating a static location answers 'Wo?' and governs the Dative case. The feminine dative article is 'der' (an der Wand).",
          },
          {
            id: "de0_q3",
            question: "Which of the following prepositions ALWAYS governs the Accusative case exclusively?",
            options: ["mit", "durch", "aus", "nach"],
            correctIndex: 1,
            explanation: "'Durch' belongs to the exclusively accusative preposition group (durch, für, gegen, ohne, um). Mit, aus, and nach govern the dative.",
          },
          {
            id: "de0_q4",
            question: "What is the masculine singular definite article in the Accusative case?",
            options: ["der", "den", "dem", "des"],
            correctIndex: 1,
            explanation: "Only the masculine article changes in the accusative case, shifting from 'der' to 'den'.",
          },
          {
            id: "de0_q5",
            question: "Complete the sentence with the correct genitive article: 'Wegen ___ Unwetters wurde der Flug gestrichen.'",
            options: ["dem", "des", "den", "das"],
            correctIndex: 1,
            explanation: "'Wegen' governs the Genitive case in standard German. 'Das Unwetter' is neuter, taking 'des' with the noun ending '-s'.",
          },
          {
            id: "de0_q6",
            question: "What is the noun plural ending added in the Dative case if the plural does not already end in -n or -s?",
            options: ["-e", "-er", "-n", "-en"],
            correctIndex: 2,
            explanation: "In the dative plural, nouns that do not already terminate in -n or -s must take an additional '-n' (e.g. die Kinder -> den Kindern).",
          },
          {
            id: "de0_q7",
            question: "Identify the correct translation: 'She writes a letter to the father.'",
            options: [
              "Sie schreibt den Vater einen Brief.",
              "Sie schreibt dem Vater einen Brief.",
              "Sie schreibt des Vaters einen Brief.",
              "Sie schreibt der Vater einen Brief.",
            ],
            correctIndex: 1,
            explanation: "The recipient (indirect object) is in the dative: dem Vater. The thing written (direct object) is in the accusative: einen Brief.",
          },
          {
            id: "de0_q8",
            question: "Which preposition pair denotes origin and destination and always takes the Dative case?",
            options: ["aus und von", "durch und um", "für und gegen", "ohne und bis"],
            correctIndex: 0,
            explanation: "'Aus' and 'von' are members of the pure dative preposition group (aus, bei, mit, nach, seit, von, zu).",
          },
          {
            id: "de0_q9",
            question: "What is the correct form: 'Wir gehen heute Abend in ___ Kino' (Movement toward destination)?",
            options: ["das (Akkusativ)", "dem (Dativ)", "der (Dativ)", "des (Genitiv)"],
            correctIndex: 0,
            explanation: "Movement towards a destination answers 'Wohin?' and triggers the Accusative case: in das (ins) Kino.",
          },
          {
            id: "de0_q10",
            question: "What case does the preposition 'trotz' (despite) govern in high-register formal German?",
            options: ["Nominativ", "Akkusativ", "Dativ", "Genitiv"],
            correctIndex: 3,
            explanation: "'Trotz' governs the Genitive case in formal German (trotz des Regens), although colloquial speech occasionally uses dative.",
          },
        ],
      },
    },
  ],
};

module.exports = { LANGUAGE_CURRICULUM };
