module Youtube
  class PlaylistId
    LIST_PARAM = /[?&]list=([A-Za-z0-9_-]+)/
    RAW_ID = /\A(PL|UU|LL|FL|OL|RD)[A-Za-z0-9_-]{10,}\z/

    def self.extract(input)
      raw = input.to_s.strip
      return if raw.empty?

      if (match = LIST_PARAM.match(raw))
        match[1]
      elsif RAW_ID.match?(raw)
        raw
      end
    end
  end
end
