require "test_helper"

class ProductTest < ActiveSupport::TestCase
  setup do
    @shop = Shop.current
  end

  test "a product needs a name, a description and a photo" do
    product = @shop.products.new(name: "  ", description: "")
    assert_not product.valid?
    assert_includes product.errors.full_messages, "Preencha o nome e a descrição."
    assert_includes product.errors.full_messages, "Escolha uma foto do produto."
  end

  test "name and description are trimmed and limited" do
    product = build_product(name: "  Pomada  ", description: "  Matte  ")
    assert product.save
    assert_equal "Pomada", product.name
    assert_equal "Matte", product.description

    product.name = "n" * 61
    assert_not product.valid?
    product.name = "Pomada"
    product.description = "d" * 241
    assert_not product.valid?
  end

  test "new products go to the end" do
    first = build_product(name: "Primeiro")
    second = build_product(name: "Segundo")
    assert first.save
    assert second.save
    assert_equal [ 1, 2 ], [ first.position, second.position ]
  end

  test "the photo is stored in postgres" do
    product = build_product
    assert product.save
    assert_equal "postgres", product.image.blob.service_name
    assert_kind_of ActiveStorage::Service::PostgresService, product.image.blob.service

    stored = ActiveStorage::PostgresFile.find_by!(key: product.image.blob.key)
    assert_equal file_fixture("pixel.png").binread, stored.data.b
    assert_not Product.column_names.include?("image")
  end

  test "rejects a file that is not a photo" do
    product = build_product
    product.image.attach(io: StringIO.new("hello"), filename: "nota.txt", content_type: "text/plain")
    assert_not product.valid?
    assert_includes product.errors.full_messages, "Essa foto precisa ser JPEG, PNG ou WebP."
  end

  test "rejects a photo over 8 MB" do
    product = build_product
    product.image.attach(
      io: StringIO.new("x" * (Product::MAX_IMAGE_BYTES + 1)),
      filename: "grande.jpg",
      content_type: "image/jpeg"
    )
    assert_not product.valid?
    assert_includes product.errors.full_messages, "Essa foto é grande demais. Escolha outra com menos de 8 MB."
  end

  test "reorder rewrites positions and refuses a partial list" do
    first = build_product(name: "Primeiro")
    second = build_product(name: "Segundo")
    third = build_product(name: "Terceiro")
    [ first, second, third ].each(&:save!)

    stamp = @shop.updated_at
    travel 1.second do
      Product.reorder!(@shop, [ third.id, first.id, second.id ])
    end
    assert_operator @shop.reload.updated_at, :>, stamp
    assert_equal [ third.id, first.id, second.id ], @shop.products.order(:position).pluck(:id)

    error = assert_raises(Product::OrderError) { Product.reorder!(@shop, [ first.id ]) }
    assert_equal "A ordem precisa incluir todos os produtos desta casa.", error.message
    assert_equal [ third.id, first.id, second.id ], @shop.products.order(:position).pluck(:id)
  end

  test "saving a product marks the house as changed" do
    stamp = @shop.updated_at
    travel 1.second do
      assert build_product.save
    end
    assert_operator @shop.reload.updated_at, :>, stamp
  end

  test "removing a product removes the file" do
    product = build_product
    product.save!
    product.destroy!
    assert_equal 0, ActiveStorage::Blob.count
    assert_equal 0, ActiveStorage::PostgresFile.count
  end

  test "a text-mode file handle still stores the whole photo" do
    path = file_fixture("pixel.png")
    key = SecureRandom.base36(28)
    checksum = OpenSSL::Digest::MD5.file(path).base64digest

    File.open(path, "r") do |io|
      ActiveStorage::Blob.service.upload(key, io, checksum: checksum)
    end

    stored = ActiveStorage::PostgresFile.find_by!(key: key)
    assert_equal path.binread, stored.data.b
  ensure
    ActiveStorage::Blob.service.delete(key) if key
  end

  private
    def build_product(name: "Pomada", description: "Para quem quer matte.")
      product = @shop.products.new(name: name, description: description)
      product.image.attach(
        io: StringIO.new(file_fixture("pixel.png").binread),
        filename: "pixel.png",
        content_type: "image/png"
      )
      product
    end
end
