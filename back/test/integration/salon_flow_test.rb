require "test_helper"

class SalonFlowTest < ActionDispatch::IntegrationTest
  PLAYLIST = "https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf"
  OTHER = "PLzzzzzzzzz9876"

  test "show creates the empty salon" do
    get api_salon_path
    assert_response :success

    body = JSON.parse(response.body)
    assert_equal "", body["shop_name"]
    assert_equal "", body["tagline"]
    assert_equal "", body["playlist_url"]
    assert_equal false, body["live"]
    assert_equal "dark", body["appearance"]
    assert_equal "ouro", body["palette"]
    assert_equal [], body["products"]
  end

  test "updates the house and refuses a bad playlist or opening without one" do
    patch api_salon_path, params: { salon: { name: "Casa Lâmina", tagline: "Navalha" } }, as: :json
    assert_response :success
    assert_equal "Casa Lâmina", JSON.parse(response.body)["shop_name"]

    patch api_salon_path, params: { salon: { playlist_url: "link-invalido" } }, as: :json
    assert_response :unprocessable_entity
    assert_includes JSON.parse(response.body)["errors"], "Não encontrei o código da playlist nesse link."
    assert_equal "", Shop.current.reload.playlist_url

    patch api_salon_path, params: { salon: { live: true } }, as: :json
    assert_response :unprocessable_entity
    assert_equal false, Shop.current.reload.live

    patch api_salon_path, params: { salon: { playlist_url: PLAYLIST, live: true } }, as: :json
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal PLAYLIST, body["playlist_url"]
    assert_equal true, body["live"]
  end

  test "playlist history can be searched and selected" do
    patch api_salon_path, params: { salon: { playlist_url: PLAYLIST } }, as: :json
    assert_response :success
    travel 1.minute do
      patch api_salon_path, params: { salon: { playlist_url: OTHER } }, as: :json
      assert_response :success
    end

    get api_playlists_path, params: { q: "playlist?list" }
    assert_response :success
    found = JSON.parse(response.body)
    assert_equal [ "PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf" ], found.map { |item| item["youtube_id"] }

    get api_playlists_path
    recent = JSON.parse(response.body)
    assert_equal OTHER, recent.first["url"]

    get api_salon_path
    assert_equal [ OTHER, PLAYLIST ], JSON.parse(response.body)["playlists"].map { |item| item["url"] }

    post select_api_playlist_path(recent.last["id"])
    assert_response :success
    assert_equal PLAYLIST, JSON.parse(response.body)["playlist_url"]
  end

  test "playback commands reach every open screen once" do
    get api_pulse_path
    assert_response :success
    opened = JSON.parse(response.body)
    assert_equal [], opened["commands"]
    assert_equal 0, opened["playback_seq"]
    assert opened["updated_at"].present?

    post api_playback_path, params: { playback: { action: "nope" } }, as: :json
    assert_response :unprocessable_entity
    assert_includes JSON.parse(response.body)["errors"], "Esse comando de reprodução não existe."

    %w[next next pause].each do |action|
      post api_playback_path, params: { playback: { action: action } }, as: :json
      assert_response :success
    end

    get api_pulse_path, params: { after: opened["playback_seq"] }
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal %w[next next pause], body["commands"].map { |item| item["action"] }
    assert_equal 3, body["playback_seq"]

    get api_pulse_path, params: { after: body["playback_seq"] }
    assert_equal [], JSON.parse(response.body)["commands"]

    patch api_salon_path, params: { salon: { name: "Casa Pulso" } }, as: :json
    assert_response :success
    get api_pulse_path, params: { after: body["playback_seq"] }
    assert_not_equal opened["updated_at"], JSON.parse(response.body)["updated_at"]
  end

  test "a playback command expires so a new screen does not replay it" do
    post api_playback_path, params: { playback: { action: "next" } }, as: :json
    assert_response :success
    seq = JSON.parse(response.body)["seq"]

    travel 30.seconds do
      get api_pulse_path, params: { after: seq - 1 }
      assert_response :success
      body = JSON.parse(response.body)
      assert_equal [], body["commands"]
      assert_equal seq, body["playback_seq"]
    end

    get api_pulse_path
    assert_equal [], JSON.parse(response.body)["commands"]
  end

  test "a pulse refuses a position that is not a number" do
    get api_pulse_path, params: { after: "depois" }
    assert_response :unprocessable_entity
    assert_includes JSON.parse(response.body)["errors"], "Não entendi a posição da reprodução."
  end

  test "history is capped at the twenty most recent" do
    21.times do |index|
      patch api_salon_path, params: { salon: { playlist_url: format("PL%010dxxxx", index) } }, as: :json
      assert_response :success
    end

    get api_playlists_path
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 20, body.size
    assert_equal "PL0000000020xxxx", body.first["youtube_id"]
  end

  test "products keep their photo, order and survive a reload" do
    post api_products_path, params: { product: { name: "", description: "", image: fixture_file_upload("pixel.png", "image/png") } }
    assert_response :unprocessable_entity
    assert_includes JSON.parse(response.body)["errors"], "Preencha o nome e a descrição."

    post api_products_path, params: {
      product: { name: "Pomada", description: "Matte", image: fixture_file_upload("nota.txt", "text/plain") }
    }
    assert_response :unprocessable_entity

    post api_products_path, params: {
      product: { name: "Pomada", description: "Matte de verdade", image: fixture_file_upload("pixel.png", "image/png") }
    }
    assert_response :created
    post api_products_path, params: {
      product: { name: "Óleo", description: "Para a barba", image: fixture_file_upload("pixel.png", "image/png") }
    }
    assert_response :created

    created = JSON.parse(response.body)
    assert_equal [ "Pomada", "Óleo" ], created["products"].map { |item| item["name"] }
    assert created["products"].all? { |item| item["image_url"].start_with?("/rails/active_storage/") }

    first, second = created["products"]
    patch api_product_order_path, params: { ids: [ second["id"], first["id"] ] }, as: :json
    assert_response :success
    assert_equal [ "Óleo", "Pomada" ], JSON.parse(response.body)["products"].map { |item| item["name"] }

    patch api_product_order_path, params: { ids: [ first["id"] ] }, as: :json
    assert_response :unprocessable_entity

    patch api_product_path(first["id"]), params: { product: { name: "Pomada nova", description: "Ainda matte" } }, as: :json
    assert_response :success
    updated = JSON.parse(response.body)["products"].find { |item| item["id"] == first["id"] }
    assert_equal "Pomada nova", updated["name"]
    assert updated["image_url"].present?

    get updated["image_url"]
    assert_response :success
    assert_equal "image/png", response.media_type

    delete api_product_path(second["id"])
    assert_response :success
    remaining = JSON.parse(response.body)["products"]
    assert_equal [ "Pomada nova" ], remaining.map { |item| item["name"] }

    get api_salon_path
    assert_equal [ "Pomada nova" ], JSON.parse(response.body)["products"].map { |item| item["name"] }
  end
end
