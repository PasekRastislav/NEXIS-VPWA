import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('first_name', 200).unique()
      table.string('last_name', 200).unique()
      table.string('user_name', 200).unique()
      table.string('email', 255).notNullable().unique()
      table.string('password', 180).notNullable()

      /**
       * Uses timestampz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at').defaultTo(this.now()).notNullable()
      table.timestamp('updated_at').defaultTo(this.now()).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
