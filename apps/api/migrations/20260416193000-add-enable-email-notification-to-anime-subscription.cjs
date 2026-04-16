'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('anime_subscription');
    if (!table.enable_email_notification) {
      await queryInterface.addColumn('anime_subscription', 'enable_email_notification', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('anime_subscription');
    if (table.enable_email_notification) {
      await queryInterface.removeColumn('anime_subscription', 'enable_email_notification');
    }
  },
};
