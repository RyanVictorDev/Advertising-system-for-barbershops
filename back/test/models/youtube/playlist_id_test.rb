require "test_helper"

class Youtube::PlaylistIdTest < ActiveSupport::TestCase
  test "reads the list parameter" do
    id = Youtube::PlaylistId.extract("https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf")
    assert_equal "PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf", id
  end

  test "reads list from a watch url" do
    id = Youtube::PlaylistId.extract("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf")
    assert_equal "PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf", id
  end

  test "accepts a raw playlist id" do
    assert_equal "PLabcdefghij", Youtube::PlaylistId.extract("  PLabcdefghij  ")
    assert_equal "UUabcdefghij", Youtube::PlaylistId.extract("UUabcdefghij")
  end

  test "rejects blanks, short ids and other links" do
    assert_nil Youtube::PlaylistId.extract("")
    assert_nil Youtube::PlaylistId.extract("   ")
    assert_nil Youtube::PlaylistId.extract("PL123")
    assert_nil Youtube::PlaylistId.extract("https://youtu.be/dQw4w9WgXcQ")
    assert_nil Youtube::PlaylistId.extract("não é playlist")
  end
end
