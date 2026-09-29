# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_09_29_180000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_postgres_files", force: :cascade do |t|
    t.string "key", null: false
    t.binary "data", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_active_storage_postgres_files_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "playback_commands", force: :cascade do |t|
    t.bigint "shop_id", null: false
    t.integer "seq", null: false
    t.string "action", limit: 16, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["shop_id", "seq"], name: "index_playback_commands_on_shop_id_and_seq", unique: true
    t.index ["shop_id"], name: "index_playback_commands_on_shop_id"
  end

  create_table "playlists", force: :cascade do |t|
    t.bigint "shop_id", null: false
    t.string "url", limit: 500, null: false
    t.string "youtube_id", limit: 128, null: false
    t.datetime "last_selected_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "title", limit: 200
    t.index ["shop_id", "youtube_id"], name: "index_playlists_on_shop_id_and_youtube_id", unique: true
    t.index ["shop_id"], name: "index_playlists_on_shop_id"
  end

  create_table "products", force: :cascade do |t|
    t.bigint "shop_id", null: false
    t.string "name", limit: 60, null: false
    t.text "description", null: false
    t.integer "position", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["shop_id", "position"], name: "index_products_on_shop_id_and_position", unique: true
    t.index ["shop_id"], name: "index_products_on_shop_id"
  end

  create_table "shops", force: :cascade do |t|
    t.string "name", limit: 42, default: "", null: false
    t.string "tagline", limit: 42, default: "", null: false
    t.string "playlist_url", limit: 500, default: "", null: false
    t.boolean "live", default: false, null: false
    t.boolean "singleton", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "appearance", limit: 16, default: "dark", null: false
    t.string "palette", limit: 16, default: "ouro", null: false
    t.index ["singleton"], name: "index_shops_on_singleton", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "playback_commands", "shops"
  add_foreign_key "playlists", "shops"
  add_foreign_key "products", "shops"
end
