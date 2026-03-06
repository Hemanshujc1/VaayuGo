const { DeliverySlot } = require('../models/index');

const slots = [
  { name: 'Early Morning', start_time: '07:00:00', end_time: '09:00:00', cutoff_time: '06:30:00' },
  { name: 'Morning', start_time: '09:00:00', end_time: '11:00:00', cutoff_time: '08:30:00' },
  { name: 'Noon', start_time: '11:00:00', end_time: '13:00:00', cutoff_time: '10:30:00' },
  { name: 'Afternoon', start_time: '13:00:00', end_time: '15:00:00', cutoff_time: '12:30:00' },
  { name: 'Evening', start_time: '15:00:00', end_time: '17:00:00', cutoff_time: '14:30:00' },
  { name: 'Late Evening', start_time: '17:00:00', end_time: '19:00:00', cutoff_time: '16:30:00' },
  { name: 'Night', start_time: '19:00:00', end_time: '21:00:00', cutoff_time: '18:30:00' },
];

const seedSlots = async () => {
  try {
    for (const slot of slots) {
      await DeliverySlot.findOrCreate({
        where: { name: slot.name },
        defaults: slot
      });
    }
    console.log('Delivery slots seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding delivery slots:', error);
    process.exit(1);
  }
};

seedSlots();
