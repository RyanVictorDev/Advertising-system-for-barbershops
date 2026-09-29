require "test_helper"

class Youtube::PlaylistTitleTest < ActiveSupport::TestCase
  test "reads the playlist name from the feed" do
    xml = <<~XML
      <?xml version="1.0" encoding="UTF-8"?>
      <feed>
       <title>THE NOTORIOUS B.I.G. GREATEST HITS (EXPLICIT)</title>
       <entry><title>Juicy</title></entry>
      </feed>
    XML

    assert_equal "THE NOTORIOUS B.I.G. GREATEST HITS (EXPLICIT)", Youtube::PlaylistTitle.extract(xml)
  end

  test "unescapes a title and ignores a feed without one" do
    assert_equal "Rock & Roll", Youtube::PlaylistTitle.extract("<title>Rock &amp; Roll</title>")
    assert_nil Youtube::PlaylistTitle.extract("<feed></feed>")
  end
end
