require "test_helper"

class PlaybackCommandTest < ActiveSupport::TestCase
  test "previous stays on the first song" do
    shop = Shop.current
    shop.advance_playback!("previous")
    assert_equal 0, shop.playback_index
    assert_equal false, shop.playback_paused

    shop.advance_playback!("next")
    shop.advance_playback!("pause")
    shop.advance_playback!("previous")
    assert_equal 0, shop.playback_index
    assert_equal false, shop.playback_paused
  end
end
