'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     queryInterface.addColumn('DeviceCountEvents', // table name
        'test1', // new field name
        {
          type: Sequelize.INTEGER(10),
          allowNull: false,
        }
      );

      queryInterface.addColumn('DeviceCountEvents', // table name
        'test2', // new field name
        {
          type: Sequelize.INTEGER(4),
          allowNull: false,
        }
      );
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('DeviceCountEvents', 'test1');
    await queryInterface.removeColumn('DeviceCountEvents', 'test2');
  }
};
