// BCT Taxonomy v1 - Behavior Change Techniques (Michie et al., 2013)
// Based on the 93 hierarchically clustered techniques

const bctTaxonomy = {
  // 1. Goals and planning
  "1.1": {
    name: "Goal setting (behavior)",
    definition: "Set or agree on a goal defined in terms of the behavior to be achieved"
  },
  "1.2": {
    name: "Problem solving",
    definition: "Analyse, or prompt the person to analyse, factors influencing the behavior and generate or select strategies that include overcoming barriers and/or increasing facilitators"
  },
  "1.3": {
    name: "Goal setting (outcome)",
    definition: "Set or agree on a goal defined in terms of a positive outcome of wanted behavior"
  },
  "1.4": {
    name: "Action planning",
    definition: "Prompt detailed planning of performance of the behavior (must include at least one of context, frequency, duration and intensity). Context may be environmental (physical or social) or internal (physical, emotional or cognitive)"
  },
  "1.5": {
    name: "Review behavior goal(s)",
    definition: "Review behavior goal(s) jointly with the person and consider modifying goal(s) or behavior change strategy in light of achievement. This may lead to re-setting the same goal, a small change in that goal or setting a new goal instead of (or in addition to) the first, or no change"
  },
  "1.6": {
    name: "Discrepancy between current behavior and goal",
    definition: "Draw attention to discrepancies between a person's current behavior (in terms of the form, frequency, duration, or intensity of that behavior) and the person's previously set outcome goals, behavioral goals or action plans"
  },
  "1.7": {
    name: "Review outcome goal(s)",
    definition: "Review outcome goal(s) jointly with the person and consider modifying goal(s) in light of achievement. This may lead to re-setting the same goal, a small change in that goal or setting a new goal instead of, or in addition to the first"
  },
  "1.8": {
    name: "Behavioral contract",
    definition: "Create a written specification of the behavior to be performed, agreed upon by the person, and witnessed by another"
  },
  "1.9": {
    name: "Commitment",
    definition: "Ask the person to affirm or reaffirm statements indicating commitment to change the behavior"
  },

  // 2. Feedback and monitoring
  "2.1": {
    name: "Monitoring of behavior by others without feedback",
    definition: "Observe or record behavior with the person's knowledge as part of a behavior change strategy"
  },
  "2.2": {
    name: "Feedback on behavior",
    definition: "Provide informative or evaluative feedback on performance of the behavior (e.g. form, frequency, duration, intensity)"
  },
  "2.3": {
    name: "Self-monitoring of behavior",
    definition: "Establish a method for the person to monitor and record their behavior(s) as part of a behavior change strategy"
  },
  "2.4": {
    name: "Self-monitoring of outcome(s) of behavior",
    definition: "Establish a method for the person to monitor and record outcome(s) of their behavior as part of a behavior change strategy"
  },
  "2.5": {
    name: "Monitoring of outcome(s) of behavior by others without feedback",
    definition: "Observe or record outcomes of behavior with the person's knowledge as part of a behavior change strategy"
  },
  "2.6": {
    name: "Biofeedback",
    definition: "Provide feedback about the person's recorded body functions"
  },
  "2.7": {
    name: "Feedback on outcome(s) of behavior",
    definition: "Provide feedback on the outcome of performance of the behavior"
  },

  // 3. Social support
  "3.1": {
    name: "Social support (unspecified)",
    definition: "Advise on, arrange or provide social support (e.g. from friends, relatives, colleagues, 'buddies' or staff) or non-contingent praise or reward for performance of the behavior. It includes encouragement and counselling, but only when it is directed at the behavior"
  },
  "3.2": {
    name: "Social support (practical)",
    definition: "Advise on, arrange, or provide practical help (e.g. from friends, relatives, colleagues, 'buddies' or staff) for performance of the behavior"
  },
  "3.3": {
    name: "Social support (emotional)",
    definition: "Advise on, arrange, or provide emotional social support (e.g. from friends, relatives, colleagues, 'buddies' or staff) for performance of the behavior"
  },

  // 4. Shaping knowledge
  "4.1": {
    name: "Instruction on how to perform the behavior",
    definition: "Advise or agree on how to perform the behavior (includes 'Skills training')"
  },
  "4.2": {
    name: "Information about antecedents",
    definition: "Provide information about antecedents (e.g. social and environmental situations and events, emotions, cognitions) that reliably predict performance of the behavior"
  },
  "4.3": {
    name: "Re-attribution",
    definition: "Elicit perceived causes of behavior and suggest alternative explanations (e.g. external or internal and stable or unstable)"
  },
  "4.4": {
    name: "Behavioral experiments",
    definition: "Advise on ways of identifying the falseness of thoughts or beliefs by viewing them as testable hypotheses and collecting and interpreting evidence"
  },

  // 5. Natural consequences
  "5.1": {
    name: "Information about health consequences",
    definition: "Provide information (e.g. written, verbal, visual) about health consequences of performing the behavior"
  },
  "5.2": {
    name: "Salience of consequences",
    definition: "Use methods specifically designed to emphasise the consequences of performing the behavior with the aim of making them more memorable (goes beyond informing about consequences)"
  },
  "5.3": {
    name: "Information about social and environmental consequences",
    definition: "Provide information (e.g. written, verbal, visual) about social and environmental consequences of performing the behavior"
  },
  "5.4": {
    name: "Monitoring of emotional consequences",
    definition: "Prompt assessment of feelings after attempts at performing the behavior"
  },
  "5.5": {
    name: "Anticipated regret",
    definition: "Induce or raise awareness of expectations of future regret about performance of the unwanted behavior"
  },
  "5.6": {
    name: "Information about emotional consequences",
    definition: "Provide information (e.g. written, verbal, visual) about emotional consequences of performing the behavior"
  },

  // 6. Comparison of behavior
  "6.1": {
    name: "Demonstration of the behavior",
    definition: "Provide an observable sample of the performance of the behavior, directly in person or indirectly (e.g. via film, pictures, for the person to aspire to or imitate)"
  },
  "6.2": {
    name: "Social comparison",
    definition: "Draw attention to others' performance to allow comparison with the person's own performance"
  },
  "6.3": {
    name: "Information about others' approval",
    definition: "Provide information about what other people think about the behavior. The information clarifies whether others will like, approve or disapprove of what the person is doing or will do"
  },

  // 7. Associations
  "7.1": {
    name: "Prompts/cues",
    definition: "Introduce or define environmental or social stimulus with the purpose of prompting or cueing the behavior. The prompt or cue would normally occur at the time or place of performance"
  },
  "7.2": {
    name: "Cue signalling reward",
    definition: "Introduce a stimulus with the explicit purpose of signalling that reward will follow"
  },
  "7.3": {
    name: "Reduce prompts/cues",
    definition: "Withdraw gradually prompts to perform the behavior"
  },
  "7.4": {
    name: "Remove access to the reward",
    definition: "Advise to avoid or reduce the frequency of access to the reward"
  },
  "7.5": {
    name: "Remove aversive stimulus",
    definition: "Remove or advise to avoid or reduce exposure to an aversive stimulus contingent on performance of the wanted behavior"
  },
  "7.6": {
    name: "Satiation",
    definition: "Advise to consume the unwanted substance/engage in the unwanted behavior repeatedly until satiated or no longer wanted"
  },
  "7.7": {
    name: "Exposure",
    definition: "Provide repeated exposure to an object, situation or experience that elicits the unwanted behavior in a safe environment until anxiety or desire responses decline"
  },
  "7.8": {
    name: "Associative learning",
    definition: "Present a neutral stimulus jointly with a stimulus that already elicits the behavior repeatedly until the neutral stimulus elicits that behavior"
  },

  // 8. Repetition and substitution
  "8.1": {
    name: "Behavioral practice/rehearsal",
    definition: "Prompt practice or rehearsal of the performance of the behavior one or more times in a context or at a time when the performance may not be necessary, in order to increase habit and skill"
  },
  "8.2": {
    name: "Behavior substitution",
    definition: "Prompt substitution of the unwanted behavior with a wanted or neutral behavior"
  },
  "8.3": {
    name: "Habit formation",
    definition: "Prompt rehearsal and repetition of the behavior in the same context repeatedly so that the context elicits the behavior"
  },
  "8.4": {
    name: "Habit reversal",
    definition: "Prompt the person to plan to replace an unwanted habitual behavior with a wanted behavior"
  },
  "8.5": {
    name: "Overcorrection",
    definition: "Request that the person practice an alternative, wanted behavior contingent on performance of an unwanted behavior"
  },
  "8.6": {
    name: "Generalisation of target behavior",
    definition: "Advise to perform the wanted behavior, which is already performed in a particular situation, in another situation"
  },
  "8.7": {
    name: "Graded tasks",
    definition: "Set easy-to-perform tasks, making them increasingly difficult, but achievable, until behavior is performed"
  },

  // 9. Comparison of outcomes
  "9.1": {
    name: "Credible source",
    definition: "Present verbal or visual communication from a credible source in favour of or against the behavior"
  },
  "9.2": {
    name: "Pros and cons",
    definition: "Advise the person to identify and compare reasons for wanting (pros) and not wanting (cons) to change the behavior"
  },
  "9.3": {
    name: "Comparative imagining of future outcomes",
    definition: "Prompt or advise the imagining and comparing of future outcomes of changed versus unchanged behavior"
  },

  // 10. Reward and threat
  "10.1": {
    name: "Material incentive (behavior)",
    definition: "Inform that money, vouchers or other valued objects will be delivered if and only if there has been effort and/or progress in performing the behavior"
  },
  "10.2": {
    name: "Material reward (behavior)",
    definition: "Arrange for the delivery of money, vouchers or other valued objects if and only if there has been effort and/or progress in performing the behavior"
  },
  "10.3": {
    name: "Non-specific reward",
    definition: "Arrange delivery of a reward if and only if there has been effort and/or progress in performing the behavior (includes 'Verbal persuasion about capability' and 'Focus on past success')"
  },
  "10.4": {
    name: "Social reward",
    definition: "Arrange verbal or non-verbal reward if and only if there has been effort and/or progress in performing the behavior"
  },
  "10.5": {
    name: "Social incentive",
    definition: "Inform that a verbal or non-verbal reward will be delivered if and only if there has been effort and/or progress in performing the behavior"
  },
  "10.6": {
    name: "Non-specific incentive",
    definition: "Inform that a reward will be delivered if and only if there has been effort and/or progress in performing the behavior"
  },
  "10.7": {
    name: "Self-incentive",
    definition: "Plan to reward oneself if and only if there has been effort and/or progress in performing the behavior"
  },
  "10.8": {
    name: "Incentive (outcome)",
    definition: "Inform that a reward will be delivered if and only if there has been effort and/or progress in achieving the behavioral outcome"
  },
  "10.9": {
    name: "Self-reward",
    definition: "Plan to reward oneself if and only if there has been effort and/or progress in performing the behavior. This includes congratulating oneself"
  },
  "10.10": {
    name: "Reward (outcome)",
    definition: "Arrange for the delivery of a reward if and only if there has been effort and/or progress in achieving the behavioral outcome"
  },
  "10.11": {
    name: "Future punishment",
    definition: "Inform that future punishment or removal of reward will be a consequence of performance of the unwanted behavior"
  },

  // 11. Regulation
  "11.1": {
    name: "Pharmacological support",
    definition: "Provide, or encourage the use of or adherence to, drugs to facilitate behavior change"
  },
  "11.2": {
    name: "Reduce negative emotions",
    definition: "Advise on ways of reducing negative emotions to facilitate performance of the behavior (includes 'Stress management')"
  },
  "11.3": {
    name: "Conserving mental resources",
    definition: "Advise on ways of minimising demands on mental resources to facilitate behavior change"
  },
  "11.4": {
    name: "Paradoxical instructions",
    definition: "Instruct to perform the wanted behavior to an extreme degree or to perform the opposite of the wanted behavior"
  },

  // 12. Antecedents
  "12.1": {
    name: "Restructuring the physical environment",
    definition: "Change, or advise to change the physical environment in order to facilitate performance of the wanted behavior or create barriers to the unwanted behavior"
  },
  "12.2": {
    name: "Restructuring the social environment",
    definition: "Change, or advise to change the social environment in order to facilitate performance of the wanted behavior or create barriers to the unwanted behavior"
  },
  "12.3": {
    name: "Avoidance/reducing exposure to cues for the behavior",
    definition: "Advise on how to avoid or reduce exposure to specific social and contextual/physical cues for the behavior, including changing daily or weekly routines"
  },
  "12.4": {
    name: "Distraction",
    definition: "Advise on how to avoid dwelling on triggers for the unwanted behavior by thinking about or engaging in other activities"
  },
  "12.5": {
    name: "Adding objects to the environment",
    definition: "Add objects to the environment in order to facilitate performance of the behavior"
  },
  "12.6": {
    name: "Body changes",
    definition: "Alter body structure, functioning or support (e.g. pacemaker, mobility aids) to facilitate the behavior"
  },

  // 13. Identity
  "13.1": {
    name: "Identification of self as role model",
    definition: "Inform that one's own behavior may be an example to others"
  },
  "13.2": {
    name: "Framing/reframing",
    definition: "Suggest the deliberate adoption of a perspective or new perspective on behavior (e.g. its purpose) in order to change cognitions or emotions about performing the behavior"
  },
  "13.3": {
    name: "Incompatible beliefs",
    definition: "Draw attention to discrepancies between current or past behavior and self-image, in order to create discomfort"
  },
  "13.4": {
    name: "Valued self-identity",
    definition: "Advise the person to write or complete rating scales about a cherished value and explain how performance of the behavior is consistent with that value"
  },
  "13.5": {
    name: "Identity associated with changed behavior",
    definition: "Advise the person to construct a new self-identity as someone who 'used to engage with the unwanted behavior'"
  },

  // 14. Scheduled consequences
  "14.1": {
    name: "Behavior cost",
    definition: "Arrange for withdrawal of something valued (e.g. money, leisure time, social interaction) if and only if an unwanted behavior is performed"
  },
  "14.2": {
    name: "Punishment",
    definition: "Arrange for aversive consequence contingent on the performance of the unwanted behavior"
  },
  "14.3": {
    name: "Remove reward",
    definition: "Arrange for discontinuation of contingent reward if and only if the unwanted behavior is performed"
  },
  "14.4": {
    name: "Reward approximation",
    definition: "Arrange for reward following any approximation to the target behavior, gradually only rewarding closer approximations"
  },
  "14.5": {
    name: "Rewarding completion",
    definition: "Arrange for reward contingent on successful completion of a behavioral goal or endpoint of the behavior, or progress towards completing the behavior"
  },
  "14.6": {
    name: "Situation-specific reward",
    definition: "Arrange for reward following the behavior in a particular situation"
  },
  "14.7": {
    name: "Reward incompatible behavior",
    definition: "Arrange for reward to be contingent on performance of a behavior incompatible with the unwanted behavior"
  },
  "14.8": {
    name: "Reward alternative behavior",
    definition: "Arrange for reward to be contingent on performance of an alternative behavior to the unwanted behavior"
  },
  "14.9": {
    name: "Reduce reward frequency",
    definition: "Arrange for rewards to be given less frequently"
  },
  "14.10": {
    name: "Remove punishment",
    definition: "Arrange for removal of punishment delivered for performance of wanted behavior. That is, increase behavior by removing aversive stimulus contingent on wanted behavior"
  },

  // 15. Self-belief
  "15.1": {
    name: "Verbal persuasion about capability",
    definition: "Tell the person that they can successfully perform the wanted behavior, focusing on effort and persistence needed"
  },
  "15.2": {
    name: "Mental rehearsal of successful performance",
    definition: "Advise to practice imagining performing the behavior successfully in relevant contexts"
  },
  "15.3": {
    name: "Focus on past success",
    definition: "Advise to think about or list previous successes in performing the behavior (or parts of it)"
  },
  "15.4": {
    name: "Self-talk",
    definition: "Encourage use of self-instruction and self-encouragement (aloud or silently) to support action"
  },

  // 16. Covert learning
  "16.1": {
    name: "Imaginary punishment",
    definition: "Advise to imagine performing the unwanted behavior in a real-life situation followed by imagining an unpleasant consequence"
  },
  "16.2": {
    name: "Imaginary reward",
    definition: "Advise to imagine performing the wanted behavior in a real-life situation followed by imagining a pleasant consequence"
  },
  "16.3": {
    name: "Vicarious consequences",
    definition: "Prompt observation of the consequences (rewards and punishments) for others when they perform the behavior"
  }
};

module.exports = { bctTaxonomy };