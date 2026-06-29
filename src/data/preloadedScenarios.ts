import { Scenario } from "@/types/scenario";

export const preloadedScenarios: Scenario[] = [
  {
    id: "academic-responsibility-lab-report",
    title: "Unfinished Contribution",
    scenario_text:
      "You are in a required physiology course with a shared lab report due tonight. One teammate says they misunderstood the division of work and has not completed the section they agreed to write. The rest of the group is frustrated because the report cannot be submitted without that section.",
    competency_tested: "Academic responsibility",
    difficulty_level: "medium",
    source_type: "preloaded",
    responses: [
      {
        id: "academic-responsibility-lab-report-r1",
        response_text:
          "Tell the teammate the group will remove their name unless they finish the section immediately.",
        target_rating: 2,
        explanation:
          "This recognizes accountability, but it starts with a threat and may worsen communication before clarifying what happened or what is still feasible.",
      },
      {
        id: "academic-responsibility-lab-report-r2",
        response_text:
          "Ask the teammate what they can complete now, divide only the remaining urgent tasks, and document each person's contribution if the instructor asks.",
        target_rating: 4,
        explanation:
          "This is timely, practical, and fair. It protects the group's work while preserving accountability and communication.",
      },
      {
        id: "academic-responsibility-lab-report-r3",
        response_text:
          "Rewrite the missing section yourself and avoid discussing the issue so the group can submit on time.",
        target_rating: 2,
        explanation:
          "Submitting on time matters, but avoiding the issue leaves the responsibility problem unresolved and may create unfairness.",
      },
      {
        id: "academic-responsibility-lab-report-r4",
        response_text:
          "Email the instructor immediately to ask for an extension and copy the whole group before trying to finish the work.",
        target_rating: 3,
        explanation:
          "Contacting the instructor can be appropriate, but doing it before making a reasonable group plan may be less complete and could escalate prematurely.",
      },
      {
        id: "academic-responsibility-lab-report-r5",
        response_text:
          "Submit the report without the missing section and let the instructor decide how to grade it.",
        target_rating: 1,
        explanation:
          "This fails to make a good-faith effort to complete the assignment and harms the group without addressing the teammate's responsibility.",
      },
    ],
    overall_takeaway:
      "Strong responses combine immediate problem-solving with fair accountability instead of ignoring the missed commitment or escalating first.",
  },
  {
    id: "peer-conflict-study-chat",
    title: "Dismissive Study Group",
    scenario_text:
      "In a study group chat, a classmate asks a basic question before an exam. Another student replies that the question shows they are not cut out for medicine. Several people see the message, and the classmate stops participating.",
    competency_tested: "Peer conflict",
    difficulty_level: "aamc_like_mixed",
    source_type: "preloaded",
    responses: [
      {
        id: "peer-conflict-study-chat-r1",
        response_text:
          "Privately message the classmate who was criticized, acknowledge the comment was inappropriate, and offer to review the concept with them.",
        target_rating: 3,
        explanation:
          "This supports the classmate and promotes learning, but it does not address the behavior that affected the group climate.",
      },
      {
        id: "peer-conflict-study-chat-r2",
        response_text:
          "Reply in the group that the comment was disrespectful, redirect the discussion to the question, and invite the group to keep feedback constructive.",
        target_rating: 4,
        explanation:
          "This addresses the harm where it occurred, models respectful communication, and keeps the group focused on learning.",
      },
      {
        id: "peer-conflict-study-chat-r3",
        response_text:
          "Ignore the exchange because correcting classmates in a group chat may make the situation more awkward.",
        target_rating: 1,
        explanation:
          "Avoiding the situation allows disrespectful behavior to stand and does not support a peer who was discouraged from participating.",
      },
      {
        id: "peer-conflict-study-chat-r4",
        response_text:
          "Send a sarcastic response mocking the student who made the comment so they understand how it feels.",
        target_rating: 1,
        explanation:
          "Responding with ridicule escalates the conflict and repeats the same disrespectful behavior.",
      },
      {
        id: "peer-conflict-study-chat-r5",
        response_text:
          "Ask the student who made the comment privately whether they meant it that harshly and encourage them to clarify or apologize.",
        target_rating: 3,
        explanation:
          "This may lead to repair, but it is less direct in supporting the affected classmate and resetting group expectations.",
      },
    ],
    overall_takeaway:
      "A strong peer-conflict response supports the person affected and also helps restore respectful group norms.",
  },
  {
    id: "teamwork-simulation-role",
    title: "Simulation Role Swap",
    scenario_text:
      "During an interprofessional simulation, your assigned role is to organize the team handoff. A teammate arrives late and says they are too anxious to present their portion, asking you to cover it without telling the facilitator.",
    competency_tested: "Teamwork",
    difficulty_level: "hard",
    source_type: "preloaded",
    responses: [
      {
        id: "teamwork-simulation-role-r1",
        response_text:
          "Cover the teammate's portion and tell the facilitator afterward that everything went as planned.",
        target_rating: 1,
        explanation:
          "This is dishonest and prevents the team from addressing a performance issue in a learning environment.",
      },
      {
        id: "teamwork-simulation-role-r2",
        response_text:
          "Briefly help the teammate organize their key points and suggest telling the facilitator if they need a modified role.",
        target_rating: 4,
        explanation:
          "This supports the teammate while maintaining transparency and preserving the purpose of the exercise.",
      },
      {
        id: "teamwork-simulation-role-r3",
        response_text:
          "Tell the teammate they should not have come if they were anxious and continue with your assigned role only.",
        target_rating: 2,
        explanation:
          "Maintaining your role is reasonable, but the response is unsupportive and misses a chance to help the team function.",
      },
      {
        id: "teamwork-simulation-role-r4",
        response_text:
          "Ask the facilitator for a brief pause so the team can clarify roles before continuing.",
        target_rating: 4,
        explanation:
          "This is transparent, practical, and team-oriented. It addresses the immediate issue without shaming the teammate.",
      },
      {
        id: "teamwork-simulation-role-r5",
        response_text:
          "Quietly redistribute the teammate's tasks among the group and avoid mentioning the late arrival.",
        target_rating: 2,
        explanation:
          "This may keep the simulation moving, but it hides the issue and limits accountability and feedback.",
      },
      {
        id: "teamwork-simulation-role-r6",
        response_text:
          "Proceed with the simulation and bring up the late arrival during the debrief as a team-process concern.",
        target_rating: 3,
        explanation:
          "Debriefing can be appropriate, but waiting may not address the teammate's immediate inability to perform their role.",
      },
    ],
    overall_takeaway:
      "Teamwork requires support and flexibility, but not at the expense of honesty or meaningful learning feedback.",
  },
  {
    id: "volunteer-interaction-language",
    title: "Waiting Room Instructions",
    scenario_text:
      "You volunteer at a community clinic check-in desk. A patient who speaks limited English appears confused by a form. The clinic is busy, and another volunteer suggests just pointing to the signature line so the line keeps moving.",
    competency_tested: "Patient or volunteer interaction",
    difficulty_level: "medium",
    source_type: "preloaded",
    responses: [
      {
        id: "volunteer-interaction-language-r1",
        response_text:
          "Point to the signature line and move on because the form is routine and the clinic is running behind.",
        target_rating: 1,
        explanation:
          "This prioritizes speed over understanding and may pressure the patient to sign something they do not understand.",
      },
      {
        id: "volunteer-interaction-language-r2",
        response_text:
          "Use simple language and gestures to explain the form as best you can without involving anyone else.",
        target_rating: 2,
        explanation:
          "The intention is helpful, but it may be inaccurate and does not use appropriate language resources.",
      },
      {
        id: "volunteer-interaction-language-r3",
        response_text:
          "Ask clinic staff about interpreter or translated-form options and let the patient know you are seeking help.",
        target_rating: 4,
        explanation:
          "This respects the patient's understanding, uses the right resources, and communicates clearly despite the busy setting.",
      },
      {
        id: "volunteer-interaction-language-r4",
        response_text:
          "Ask another waiting patient who seems to speak the same language to translate the form.",
        target_rating: 2,
        explanation:
          "This tries to solve the problem but raises privacy and accuracy concerns because an informal stranger is not the right resource.",
      },
      {
        id: "volunteer-interaction-language-r5",
        response_text:
          "Tell the other volunteer you are uncomfortable rushing the patient and ask them to help manage the line while you contact staff.",
        target_rating: 4,
        explanation:
          "This balances patient respect with workflow needs and seeks appropriate support rather than acting beyond your role.",
      },
    ],
    overall_takeaway:
      "Respectful service means protecting understanding and privacy, even when the setting is busy.",
  },
  {
    id: "confidentiality-neighbor",
    title: "Recognizing a Neighbor",
    scenario_text:
      "While volunteering at a hospital information desk, you see your neighbor checking in for an appointment. Later that day, your roommate asks whether the neighbor looked sick because they saw the neighbor's car in the hospital garage.",
    competency_tested: "Confidentiality",
    difficulty_level: "easy",
    source_type: "preloaded",
    responses: [
      {
        id: "confidentiality-neighbor-r1",
        response_text:
          "Say that you cannot discuss who you saw at the hospital and change the subject.",
        target_rating: 4,
        explanation:
          "This clearly protects privacy and sets an appropriate boundary without revealing or confirming information.",
      },
      {
        id: "confidentiality-neighbor-r2",
        response_text:
          "Tell your roommate the neighbor seemed fine but avoid sharing the appointment reason.",
        target_rating: 1,
        explanation:
          "Even a reassuring comment confirms the neighbor was present and shares an observation learned through a volunteer role.",
      },
      {
        id: "confidentiality-neighbor-r3",
        response_text:
          "Mention that many people go to the hospital for routine reasons and avoid saying whether you saw the neighbor.",
        target_rating: 3,
        explanation:
          "This avoids confirming the visit, but a clearer confidentiality boundary would be stronger.",
      },
      {
        id: "confidentiality-neighbor-r4",
        response_text:
          "Ask your roommate why they want to know before deciding whether to answer.",
        target_rating: 2,
        explanation:
          "Understanding the motive is not necessary; the key issue is that you should not disclose or confirm private information.",
      },
      {
        id: "confidentiality-neighbor-r5",
        response_text:
          "Tell the volunteer coordinator you recognized someone and ask whether there are any privacy reminders you should follow.",
        target_rating: 3,
        explanation:
          "Seeking guidance can be helpful, but the immediate response to the roommate still needs a firm privacy boundary.",
      },
    ],
    overall_takeaway:
      "Confidentiality includes not confirming that someone was present, even when the information seems harmless.",
  },
  {
    id: "feedback-improvement-osce",
    title: "Unexpected Feedback",
    scenario_text:
      "After a practice clinical skills session, a faculty observer says your patient explanation was organized but came across as rushed. You thought the session went well and feel the feedback is unfair because the station was short.",
    competency_tested: "Feedback and improvement",
    difficulty_level: "medium",
    source_type: "preloaded",
    responses: [
      {
        id: "feedback-improvement-osce-r1",
        response_text:
          "Thank the observer, ask for one specific moment that felt rushed, and plan a way to practice pacing before the next session.",
        target_rating: 4,
        explanation:
          "This is receptive, specific, and improvement-oriented while still recognizing that pacing is a learnable skill.",
      },
      {
        id: "feedback-improvement-osce-r2",
        response_text:
          "Explain that the station timing caused the problem and ask the observer to adjust the evaluation.",
        target_rating: 2,
        explanation:
          "Timing may be relevant, but focusing on changing the evaluation avoids first understanding the feedback.",
      },
      {
        id: "feedback-improvement-osce-r3",
        response_text:
          "Ignore the feedback because one observer's impression is subjective.",
        target_rating: 1,
        explanation:
          "Dismissing feedback prevents growth and misses an opportunity to improve communication.",
      },
      {
        id: "feedback-improvement-osce-r4",
        response_text:
          "Ask a classmate to watch your next practice and comment specifically on pacing.",
        target_rating: 3,
        explanation:
          "This is constructive, though it would be stronger if paired with clarifying the faculty feedback directly.",
      },
      {
        id: "feedback-improvement-osce-r5",
        response_text:
          "Tell the observer you disagree but will try to slow down if the same feedback appears again.",
        target_rating: 2,
        explanation:
          "This leaves room for future change, but it is defensive and delays acting on a current concern.",
      },
    ],
    overall_takeaway:
      "Effective feedback responses seek specifics, show openness, and convert critique into a concrete next step.",
  },
  {
    id: "cultural-humility-diet",
    title: "Lunch Workshop",
    scenario_text:
      "You help organize a required noon workshop. A classmate quietly says the provided lunch conflicts with their dietary restrictions and asks whether there are other options. The event has already started, and the organizer is focused on the speaker.",
    competency_tested: "Cultural humility",
    difficulty_level: "aamc_like_mixed",
    source_type: "preloaded",
    responses: [
      {
        id: "cultural-humility-diet-r1",
        response_text:
          "Tell the classmate the food was ordered for everyone and suggest they bring lunch next time.",
        target_rating: 1,
        explanation:
          "This dismisses a reasonable concern and places the burden entirely on the classmate without trying to help.",
      },
      {
        id: "cultural-humility-diet-r2",
        response_text:
          "Quietly ask the organizer or venue staff whether any acceptable options are available and follow up with the classmate.",
        target_rating: 4,
        explanation:
          "This is respectful, discreet, and practical. It seeks a solution without drawing unwanted attention.",
      },
      {
        id: "cultural-humility-diet-r3",
        response_text:
          "Ask the classmate to explain the restriction in detail so you can decide whether it is necessary.",
        target_rating: 1,
        explanation:
          "This is intrusive and positions you as judging the legitimacy of the classmate's needs.",
      },
      {
        id: "cultural-humility-diet-r4",
        response_text:
          "Apologize for the oversight and suggest raising dietary needs earlier for future events.",
        target_rating: 2,
        explanation:
          "The apology is appropriate, but it does not address the immediate problem and may sound like a deflection.",
      },
      {
        id: "cultural-humility-diet-r5",
        response_text:
          "After helping with the current lunch, recommend that future event forms include an optional dietary-needs question.",
        target_rating: 3,
        explanation:
          "This improves the process, but it is most effective when paired with immediate support for the classmate.",
      },
    ],
    overall_takeaway:
      "Cultural humility often means responding discreetly to an immediate need and improving the system for next time.",
  },
  {
    id: "professional-boundaries-social-media",
    title: "Friend Request",
    scenario_text:
      "After several weeks volunteering with a hospital recreation program, a patient you often talk with sends you a social media friend request and a message saying they hope you can stay in touch after discharge.",
    competency_tested: "Professional boundaries",
    difficulty_level: "medium",
    source_type: "preloaded",
    responses: [
      {
        id: "professional-boundaries-social-media-r1",
        response_text:
          "Accept the request because the patient initiated it and the volunteer role is informal.",
        target_rating: 1,
        explanation:
          "Accepting blurs boundaries and may create expectations that are not appropriate for the volunteer relationship.",
      },
      {
        id: "professional-boundaries-social-media-r2",
        response_text:
          "Do not respond online, and ask the volunteer coordinator how to decline while maintaining a supportive tone.",
        target_rating: 4,
        explanation:
          "This protects boundaries and seeks role-appropriate guidance before responding.",
      },
      {
        id: "professional-boundaries-social-media-r3",
        response_text:
          "Tell the patient in person that you appreciate the message but cannot connect through personal social media as a volunteer.",
        target_rating: 4,
        explanation:
          "This is clear, respectful, and maintains the boundary while acknowledging the patient's intent.",
      },
      {
        id: "professional-boundaries-social-media-r4",
        response_text:
          "Ignore the request completely and avoid the patient during future volunteer shifts.",
        target_rating: 2,
        explanation:
          "Not accepting is appropriate, but avoidance may feel rejecting and does not communicate the boundary professionally.",
      },
      {
        id: "professional-boundaries-social-media-r5",
        response_text:
          "Create a separate account for patients and volunteers so the connection is less personal.",
        target_rating: 2,
        explanation:
          "This tries to manage privacy but still extends the relationship beyond the role and may conflict with program expectations.",
      },
    ],
    overall_takeaway:
      "Professional warmth does not require personal access; strong responses set boundaries respectfully and within role expectations.",
  },
  {
    id: "reliability-clinic-shift",
    title: "Same-Day Coverage",
    scenario_text:
      "You are scheduled for a weekly free clinic shift. On the morning of the shift, an interview opportunity becomes available at the same time. The clinic coordinator previously mentioned that same-day absences are difficult to cover.",
    competency_tested: "Reliability and dependability",
    difficulty_level: "hard",
    source_type: "preloaded",
    responses: [
      {
        id: "reliability-clinic-shift-r1",
        response_text:
          "Attend the interview and email the coordinator afterward with an apology.",
        target_rating: 1,
        explanation:
          "This knowingly leaves the clinic without coverage and delays communication until after the harm occurs.",
      },
      {
        id: "reliability-clinic-shift-r2",
        response_text:
          "Immediately contact the coordinator, explain the conflict honestly, and ask whether any approved backup options exist before changing plans.",
        target_rating: 4,
        explanation:
          "This is honest and timely, and it respects the clinic's need to plan coverage before you make a change.",
      },
      {
        id: "reliability-clinic-shift-r3",
        response_text:
          "Ask another volunteer to cover and notify the coordinator only if that person agrees.",
        target_rating: 3,
        explanation:
          "Finding coverage is helpful, but the coordinator should be included because they are responsible for staffing and approval.",
      },
      {
        id: "reliability-clinic-shift-r4",
        response_text:
          "Skip the interview because you already committed to the clinic and do not mention the conflict.",
        target_rating: 3,
        explanation:
          "Honoring the commitment is reliable, but there may be a professional way to discuss coverage if done promptly and honestly.",
      },
      {
        id: "reliability-clinic-shift-r5",
        response_text:
          "Tell the coordinator you are sick so they do not question why you cannot attend.",
        target_rating: 1,
        explanation:
          "This is dishonest and undermines trust, even if the absence might be covered.",
      },
    ],
    overall_takeaway:
      "Reliability is not only showing up; it also means timely, honest communication when a conflict appears.",
  },
  {
    id: "ethical-responsibility-answer-key",
    title: "Shared Answer File",
    scenario_text:
      "A classmate sends you a document that appears to contain answers to a take-home quiz that is still open. They say it was passed down from last year's class and that many students use it to check their work.",
    competency_tested: "Ethical responsibility",
    difficulty_level: "aamc_like_mixed",
    source_type: "preloaded",
    responses: [
      {
        id: "ethical-responsibility-answer-key-r1",
        response_text:
          "Use the document only after finishing the quiz yourself because then it is just a study aid.",
        target_rating: 1,
        explanation:
          "Using answers for an open quiz is still academically dishonest, even if you first attempt the work independently.",
      },
      {
        id: "ethical-responsibility-answer-key-r2",
        response_text:
          "Do not use the file, tell the classmate you are uncomfortable with it, and ask the course team how to handle the material.",
        target_rating: 4,
        explanation:
          "This avoids misconduct, communicates a clear boundary, and seeks guidance from the appropriate authority.",
      },
      {
        id: "ethical-responsibility-answer-key-r3",
        response_text:
          "Delete the file and say nothing because you did not ask to receive it.",
        target_rating: 2,
        explanation:
          "Deleting avoids personal use, but it does not address the ongoing integrity issue or protect the fairness of the assessment.",
      },
      {
        id: "ethical-responsibility-answer-key-r4",
        response_text:
          "Warn close friends not to use the document but avoid contacting the course team.",
        target_rating: 2,
        explanation:
          "This helps a few peers but leaves the broader issue unresolved and may preserve unfair access.",
      },
      {
        id: "ethical-responsibility-answer-key-r5",
        response_text:
          "Ask the classmate where the file came from and whether they know if the instructor permits it before deciding what to do.",
        target_rating: 3,
        explanation:
          "Clarifying can be reasonable, but the suspicious timing and content still require avoiding use and likely seeking official guidance.",
      },
    ],
    overall_takeaway:
      "Academic integrity responses should protect fairness and seek appropriate guidance, not just avoid getting personally caught.",
  },
  {
    id: "research-integrity-outlier",
    title: "Messy Data Point",
    scenario_text:
      "In a research assistant role, you enter survey data for a project. One participant's response looks inconsistent with the rest of their survey. A senior student says to leave it out because it will make the analysis cleaner and the deadline is close.",
    competency_tested: "Research integrity",
    difficulty_level: "hard",
    source_type: "preloaded",
    responses: [
      {
        id: "research-integrity-outlier-r1",
        response_text:
          "Exclude the response because the senior student has more experience with the project.",
        target_rating: 1,
        explanation:
          "Removing data without an approved reason compromises integrity and relies on authority rather than protocol.",
      },
      {
        id: "research-integrity-outlier-r2",
        response_text:
          "Enter the response as recorded, flag it according to lab procedures, and ask the project lead how questionable entries should be handled.",
        target_rating: 4,
        explanation:
          "This preserves the original data, follows process, and seeks appropriate guidance before any exclusion.",
      },
      {
        id: "research-integrity-outlier-r3",
        response_text:
          "Change the response to match the participant's other answers because it was probably a mistake.",
        target_rating: 1,
        explanation:
          "Altering data based on an assumption is dishonest and undermines the validity of the research.",
      },
      {
        id: "research-integrity-outlier-r4",
        response_text:
          "Ask the senior student to put the instruction in writing before you exclude the response.",
        target_rating: 2,
        explanation:
          "Documenting instructions is not enough if the instruction itself may violate the protocol.",
      },
      {
        id: "research-integrity-outlier-r5",
        response_text:
          "Tell the senior student you are not comfortable excluding it without checking the protocol.",
        target_rating: 3,
        explanation:
          "This is appropriate and principled, but it is stronger when paired with actually flagging the data and consulting the lead.",
      },
    ],
    overall_takeaway:
      "Research integrity requires preserving records and following approved procedures, especially under deadline pressure.",
  },
  {
    id: "supervisor-communication-missed-email",
    title: "Unread Preceptor Email",
    scenario_text:
      "You shadow a physician once a week. You arrive and learn the clinic schedule changed; the physician emailed you yesterday asking you to come an hour later, but you missed the message. The front desk is busy and the physician is with a patient.",
    competency_tested: "Communication with supervisors",
    difficulty_level: "medium",
    source_type: "preloaded",
    responses: [
      {
        id: "supervisor-communication-missed-email-r1",
        response_text:
          "Wait quietly in the lobby and hope the physician has time for you later.",
        target_rating: 2,
        explanation:
          "This avoids interrupting care, but it is passive and does not communicate or correct the scheduling issue.",
      },
      {
        id: "supervisor-communication-missed-email-r2",
        response_text:
          "Apologize to the front desk, ask the best way to notify the physician without disrupting care, and offer to return at the requested time.",
        target_rating: 4,
        explanation:
          "This takes responsibility, respects clinic workflow, and offers a practical correction.",
      },
      {
        id: "supervisor-communication-missed-email-r3",
        response_text:
          "Send the physician a brief message acknowledging that you missed the email and asking whether you should return later or reschedule.",
        target_rating: 4,
        explanation:
          "This communicates directly, accepts responsibility, and lets the supervisor choose the least disruptive option.",
      },
      {
        id: "supervisor-communication-missed-email-r4",
        response_text:
          "Tell the front desk that the physician should have texted because email is easy to miss.",
        target_rating: 1,
        explanation:
          "This deflects responsibility and is disrespectful to clinic staff and the supervisor's communication process.",
      },
      {
        id: "supervisor-communication-missed-email-r5",
        response_text:
          "Leave immediately because staying would inconvenience the clinic.",
        target_rating: 2,
        explanation:
          "Leaving may reduce disruption, but doing so without communicating creates uncertainty and misses accountability.",
      },
    ],
    overall_takeaway:
      "Supervisor communication should be prompt, accountable, and mindful of patient-care workflow.",
  },
  {
    id: "handling-mistakes-signin",
    title: "Volunteer Sign-In Error",
    scenario_text:
      "At a health fair, volunteers must sign in and record completed service hours. At the end of the event, you realize you accidentally signed next to another volunteer's name and they may not receive credit for attending.",
    competency_tested: "Handling mistakes",
    difficulty_level: "easy",
    source_type: "preloaded",
    responses: [
      {
        id: "handling-mistakes-signin-r1",
        response_text:
          "Cross out the incorrect entry, write both names clearly if the form allows it, and tell the coordinator what happened.",
        target_rating: 4,
        explanation:
          "This corrects the record transparently and involves the person responsible for tracking hours.",
      },
      {
        id: "handling-mistakes-signin-r2",
        response_text:
          "Do nothing because the mistake is small and the coordinator probably will not notice.",
        target_rating: 1,
        explanation:
          "Ignoring the error may affect another volunteer's credit and avoids responsibility for a fixable mistake.",
      },
      {
        id: "handling-mistakes-signin-r3",
        response_text:
          "Tell the other volunteer privately so they can decide whether to raise it.",
        target_rating: 2,
        explanation:
          "Informing them is fair, but it shifts the burden instead of correcting the mistake you made.",
      },
      {
        id: "handling-mistakes-signin-r4",
        response_text:
          "Ask the coordinator how to correct the sign-in sheet before making changes to the official record.",
        target_rating: 4,
        explanation:
          "This is transparent and careful with an official record, especially if corrections have a required process.",
      },
      {
        id: "handling-mistakes-signin-r5",
        response_text:
          "Add the other volunteer's name to a blank line and avoid mentioning your original mistake.",
        target_rating: 2,
        explanation:
          "This may restore credit, but it does not fully correct the inaccurate entry or show accountability.",
      },
    ],
    overall_takeaway:
      "Small mistakes still deserve transparent correction, especially when another person's record may be affected.",
  },
  {
    id: "scheduling-conflict-service",
    title: "Overlapping Commitments",
    scenario_text:
      "You agreed to lead a campus service event next Saturday. A required exam review session is later scheduled for the same morning. Other volunteers can attend the service event, but you were the only person trained to check in community partners.",
    competency_tested: "Scheduling or commitment conflicts",
    difficulty_level: "hard",
    source_type: "preloaded",
    responses: [
      {
        id: "scheduling-conflict-service-r1",
        response_text:
          "Attend the review session and assume the other volunteers will figure out partner check-in.",
        target_rating: 1,
        explanation:
          "This abandons a known responsibility without communication or preparation.",
      },
      {
        id: "scheduling-conflict-service-r2",
        response_text:
          "Notify the service coordinator promptly, explain the conflict, and offer to train a backup or prepare clear check-in instructions.",
        target_rating: 4,
        explanation:
          "This is timely, honest, and solution-oriented. It respects both commitments and reduces disruption.",
      },
      {
        id: "scheduling-conflict-service-r3",
        response_text:
          "Skip the review session because you made the service commitment first.",
        target_rating: 3,
        explanation:
          "Honoring the prior commitment is responsible, but it may not be the only professional solution if coverage can be arranged early.",
      },
      {
        id: "scheduling-conflict-service-r4",
        response_text:
          "Ask a friend who has not been trained to handle partner check-in and tell them to call you if problems come up.",
        target_rating: 2,
        explanation:
          "This tries to provide coverage, but it may place an unprepared person in a key role without coordinator approval.",
      },
      {
        id: "scheduling-conflict-service-r5",
        response_text:
          "Wait until a few days before the event to decide because the review session details may change.",
        target_rating: 2,
        explanation:
          "Waiting preserves options for you but gives the service team less time to plan for an important role.",
      },
    ],
    overall_takeaway:
      "When commitments conflict, strong responses communicate early and help transfer responsibilities responsibly.",
  },
  {
    id: "unprofessional-behavior-hallway",
    title: "Hallway Comment",
    scenario_text:
      "During a clinical observation day, you hear a student make a mocking comment in the hallway about a patient's clothing. The patient is not nearby, but another staff member looks uncomfortable and says nothing.",
    competency_tested: "Witnessing unprofessional behavior",
    difficulty_level: "aamc_like_mixed",
    source_type: "preloaded",
    responses: [
      {
        id: "unprofessional-behavior-hallway-r1",
        response_text:
          "Say privately to the student that the comment was disrespectful and that patient dignity should be protected even outside the room.",
        target_rating: 4,
        explanation:
          "This addresses the behavior directly, preserves dignity, and avoids unnecessary public shaming.",
      },
      {
        id: "unprofessional-behavior-hallway-r2",
        response_text:
          "Laugh briefly so the moment passes and then change the topic.",
        target_rating: 1,
        explanation:
          "Laughing reinforces the disrespectful comment and fails to uphold professional expectations.",
      },
      {
        id: "unprofessional-behavior-hallway-r3",
        response_text:
          "Report the student immediately to the clerkship director without speaking to them.",
        target_rating: 3,
        explanation:
          "Reporting may be warranted for serious or repeated conduct, but immediate escalation may be less proportionate for a first observed comment.",
      },
      {
        id: "unprofessional-behavior-hallway-r4",
        response_text:
          "Ask the staff member later whether there is a preferred way for observers to handle comments like that.",
        target_rating: 3,
        explanation:
          "Seeking guidance is appropriate, though it does not itself address the student who made the comment.",
      },
      {
        id: "unprofessional-behavior-hallway-r5",
        response_text:
          "Tell the student in front of everyone that they are unfit for patient care.",
        target_rating: 1,
        explanation:
          "This escalates personally and publicly rather than correcting the behavior in a professional way.",
      },
      {
        id: "unprofessional-behavior-hallway-r6",
        response_text:
          "If the comments continue after you address it, bring the pattern to the appropriate supervisor.",
        target_rating: 4,
        explanation:
          "This combines direct feedback with appropriate escalation if the behavior persists.",
      },
    ],
    overall_takeaway:
      "Professionalism includes addressing disrespectful comments proportionately and escalating patterns or serious concerns.",
  },
  {
    id: "accountability-missed-training",
    title: "Missed Orientation Detail",
    scenario_text:
      "You begin a new hospice volunteer role and realize you missed the part of orientation explaining which topics volunteers should avoid initiating with families. A family member begins asking emotional questions during your first visit.",
    competency_tested: "Accountability",
    difficulty_level: "hard",
    source_type: "preloaded",
    responses: [
      {
        id: "accountability-missed-training-r1",
        response_text:
          "Listen supportively, avoid giving advice, and tell the volunteer supervisor afterward that you need clarification on boundaries before future visits.",
        target_rating: 4,
        explanation:
          "This responds compassionately within a limited role and promptly addresses the training gap.",
      },
      {
        id: "accountability-missed-training-r2",
        response_text:
          "Give your personal opinion because the family member seems to need comfort in the moment.",
        target_rating: 1,
        explanation:
          "Good intentions do not justify acting outside role boundaries in a sensitive setting.",
      },
      {
        id: "accountability-missed-training-r3",
        response_text:
          "Tell the family member you are not sure you are the right person for that question and offer to connect them with staff.",
        target_rating: 4,
        explanation:
          "This is honest, respectful, and appropriately redirects the concern to trained staff.",
      },
      {
        id: "accountability-missed-training-r4",
        response_text:
          "Avoid future visits with that family because the conversation made you uncomfortable.",
        target_rating: 2,
        explanation:
          "Discomfort is understandable, but avoidance does not address the role-boundary knowledge gap.",
      },
      {
        id: "accountability-missed-training-r5",
        response_text:
          "Ask another new volunteer what they remember from orientation and follow their advice.",
        target_rating: 2,
        explanation:
          "A peer may help, but sensitive role boundaries should be clarified with the supervisor or official materials.",
      },
    ],
    overall_takeaway:
      "Accountability includes recognizing limits, responding within role, and closing knowledge gaps before they affect future interactions.",
  },
];
