const bctTechniques = [
  { id: "BCT 1.2", message: "Remember your why: You started this journey to reduce stress and improve focus for your studies." },
  { id: "BCT 8.1", message: "Small steps lead to big changes: Just 5 minutes today builds the foundation for lifelong well-being." },
  { id: "BCT 13.1", message: "You're building a new identity: Each meditation session makes you someone who prioritizes mental health." },
  { id: "BCT 2.3", message: "Progress tracking: You've meditated X days this month - you're creating a powerful habit!" },
  { id: "BCT 3.1", message: "Social accountability: Join thousands of students who are transforming their academic experience through mindfulness." },
  { id: "BCT 12.1", message: "Environmental restructuring: Find your quiet space and make it your daily sanctuary for peace." },
  { id: "BCT 1.4", message: "Implementation intention: 'When I feel stressed about exams, I will meditate for 10 minutes.'" },
  { id: "BCT 10.9", message: "Self-reward: After completing this week's meditations, treat yourself to something you enjoy." }
];

const meditationVideos = {
  '<5 min': [
    { title: "Quick Breathing Exercise", url: "https://youtube.com/watch?v=aAVPDYhW_nE", duration: "3 min" },
    { title: "Mindful Moment", url: "https://youtube.com/watch?v=ZToicYcHIOU", duration: "4 min" }
  ],
  '5-10 min': [
    { title: "Body Scan for Students", url: "https://youtube.com/watch?v=15q-N-_kkrU", duration: "8:42" },
    { title: "Focus Meditation", url: "https://youtube.com/watch?v=6p_yaNFSYao", duration: "10:00" },
    { title: "Custom Meditation Video 1", url: "https://www.youtube.com/watch?v=wE292vsJcBY", duration: "11:42" },
    { title: "Custom Meditation Video 2", url: "https://www.youtube.com/watch?v=lS0kcSNlULw", duration: "10:15" },
    { title: "Custom Meditation Video 3", url: "https://www.youtube.com/watch?v=Hvs_49dikDQ", duration: "9:30" }
  ],
  '10 min': [
    { title: "Morning Clarity", url: "https://youtube.com/watch?v=jPpUNAFHgxM", duration: "10 min" },
    { title: "Stress Relief Session", url: "https://youtube.com/watch?v=YRPh_GaiL8s", duration: "10 min" }
  ],
  '15 min': [
    { title: "Deep Relaxation", url: "https://youtube.com/watch?v=1vx8iUvfyCY", duration: "15 min" },
    { title: "Academic Anxiety Relief", url: "https://youtube.com/watch?v=64ZU2UCBpHI", duration: "15 min" }
  ],
  '20 min': [
    { title: "Extended Mindfulness", url: "https://youtube.com/watch?v=Jyy0ra2WcQQ", duration: "20 min" },
    { title: "Concentration Building", url: "https://youtube.com/watch?v=inpok4MKVLM", duration: "20 min" }
  ],
  '30 min': [
    { title: "Complete Wellness Session", url: "https://youtube.com/watch?v=H3dKLHC3fCs", duration: "30 min" },
    { title: "Deep Meditation Practice", url: "https://youtube.com/watch?v=mfzaFbk3I2s", duration: "30 min" }
  ]
};

const durationOptions = ['<5 min', '5-10 min', '10 min', '15 min', '20 min', '30 min'];

module.exports = {
  bctTechniques,
  meditationVideos,
  durationOptions
};