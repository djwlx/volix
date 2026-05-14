module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('volix_user_rss_subscription', 'name', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('volix_user_rss_subscription', 'name');
  },
};
