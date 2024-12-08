import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Kicks extends BaseSchema {
  protected tableName = 'kicks'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE') // User being kicked

      table
        .integer('channel_id')
        .unsigned()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE') // Channel where the kick occurred

      table.integer('created_by').unsigned().references('id').inTable('users').onDelete('CASCADE') // User who initiated the kick

      table.unique(['user_id', 'channel_id', 'created_by']) // Ensure no duplicate kicks from the same user

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
