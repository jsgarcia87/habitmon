module RPG
  class MapInfo
    attr_accessor :name
  end
end
map_infos = Marshal.load(File.binread('Data/MapInfos.rxdata'))
map_infos.each do |id, info|
  puts "Map#{id.to_s.rjust(3, '0')}: #{info.name}"
end
