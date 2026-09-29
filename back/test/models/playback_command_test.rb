require "test_helper"

class PlaybackCommandTest < ActiveSupport::TestCase
  test "only the recent commands stay stored" do
    shop = Shop.current
    (PlaybackCommand::KEEP + 1).times { PlaybackCommand.issue!(shop, "next") }

    stored = PlaybackCommand.where(shop: shop)
    assert_equal PlaybackCommand::KEEP, stored.count
    assert_equal PlaybackCommand::KEEP + 1, stored.maximum(:seq)
  end
end
