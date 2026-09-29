require "test_helper"

class ShopTest < ActiveSupport::TestCase
  PLAYLIST = "https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf"
  OTHER = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL0000000001aaaa"

  test "there is a single shop" do
    first = Shop.current
    second = Shop.current

    assert_equal first.id, second.id
    assert_equal 1, Shop.count
  end

  test "name and tagline can be blank and are trimmed" do
    shop = Shop.current
    assert shop.update(name: "  Casa Lâmina  ", tagline: "  Navalha  ")
    assert_equal "Casa Lâmina", shop.name
    assert_equal "Navalha", shop.tagline
  end

  test "the house starts dark with the gold palette" do
    shop = Shop.current
    assert_equal "dark", shop.appearance
    assert_equal "ouro", shop.palette
  end

  test "a theme must be one of the known choices" do
    shop = Shop.current
    assert shop.update(appearance: "light", palette: "vinho")
    assert_equal "light", shop.appearance
    assert_equal "vinho", shop.palette

    assert_not shop.update(appearance: "azul")
    assert_includes shop.errors.full_messages, "Escolha o tema escuro ou o claro."
    assert_not shop.update(palette: "rosa")
    assert_includes shop.errors.full_messages, "Escolha uma paleta da casa."
  end

  test "name and tagline stop at 42 characters" do
    shop = Shop.current
    assert_not shop.update(name: "a" * 43)
    assert_not shop.update(tagline: "b" * 43)
  end

  test "a blank playlist is allowed and does not enter the history" do
    shop = Shop.current
    assert shop.update(playlist_url: "   ")
    assert_equal "", shop.playlist_url
    assert_empty shop.playlists
  end

  test "an unrecognized playlist is refused" do
    shop = Shop.current
    assert_not shop.update(playlist_url: "https://example.com/radio")
    assert_includes shop.errors.full_messages, "Não encontrei o código da playlist nesse link."
    assert_empty shop.playlists
  end

  test "a recognized playlist is stored and remembered once" do
    shop = Shop.current
    assert shop.update(playlist_url: PLAYLIST)
    assert shop.update(name: "Casa")

    assert_equal 1, shop.playlists.count
    playlist = shop.playlists.first
    assert_equal "PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf", playlist.youtube_id
    assert_equal PLAYLIST, playlist.url
  end

  test "a recognized playlist stores the youtube title" do
    Youtube::PlaylistTitle.singleton_class.alias_method(:fetch_original, :fetch)
    Youtube::PlaylistTitle.define_singleton_method(:fetch) { |_youtube_id| "Select Lectures" }
    assert Shop.current.update(playlist_url: PLAYLIST)
    assert_equal "Select Lectures", Shop.current.playlists.first.title
  ensure
    Youtube::PlaylistTitle.singleton_class.alias_method(:fetch, :fetch_original)
  end

  test "the same playlist updates the history instead of duplicating it" do
    shop = Shop.current
    shop.update!(playlist_url: "PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf")
    original = shop.playlists.first.last_selected_at

    travel 1.minute do
      shop.update!(playlist_url: PLAYLIST)
    end

    assert_equal 1, shop.playlists.count
    assert_equal PLAYLIST, shop.playlists.first.url
    assert_operator shop.playlists.first.last_selected_at, :>, original
  end

  test "the salon opens only with a recognized playlist" do
    shop = Shop.current
    assert_not shop.update(live: true)
    assert_includes shop.errors.full_messages, "Cole o link de uma playlist para abrir."

    assert shop.update(playlist_url: PLAYLIST, live: true)
    assert shop.live?
  end

  test "clearing the playlist keeps the history and refuses to stay live" do
    shop = Shop.current
    shop.update!(playlist_url: PLAYLIST, live: true)

    assert_not shop.update(playlist_url: "")
    assert shop.reload.live?
    assert_equal 1, shop.playlists.count

    assert shop.update(live: false, playlist_url: "")
    assert_not shop.live?
    assert_equal "", shop.playlist_url
    assert_equal 1, shop.playlists.count
  end

  test "search returns the newest matches first" do
    shop = Shop.current
    shop.update!(playlist_url: PLAYLIST)
    travel 1.minute do
      shop.update!(playlist_url: OTHER)
    end

    found = shop.playlists.search("playlist?list=PL")
    assert_equal [ "PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf" ], found.map(&:youtube_id)

    shop.playlists.find_by!(youtube_id: "PL0000000001aaaa").update!(title: "Greatest Hits")
    by_name = shop.playlists.search("greatest")
    assert_equal [ "PL0000000001aaaa" ], by_name.map(&:youtube_id)

    recent = shop.playlists.recent
    assert_equal "PL0000000001aaaa", recent.first.youtube_id
  end
end
