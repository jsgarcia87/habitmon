require 'json'

module RPG
  class Map
    attr_accessor :width, :height, :tileset_id, :autoplay_bgm, :bgm, :autoplay_bgs, :bgs, :encounter_step, :encounter_list, :data, :events
  end
  class AudioFile
    attr_accessor :name, :volume, :pitch
  end
  class Event
    attr_accessor :id, :name, :x, :y, :pages
  end
  class Event::Page
    attr_accessor :condition, :graphic, :move_type, :move_speed, :move_frequency, :move_route, :walk_anime, :step_anime, :direction_fix, :through, :always_on_top, :trigger, :list
  end
  class Event::Page::Condition
    attr_accessor :switch1_valid, :switch2_valid, :variable_valid, :self_switch_valid, :switch1_id, :switch2_id, :variable_id, :variable_value, :self_switch_ch
  end
  class Event::Page::Graphic
    attr_accessor :tile_id, :character_name, :character_hue, :direction, :pattern, :opacity, :blend_type
  end
  class EventCommand
    attr_accessor :code, :indent, :parameters
  end
  class MoveRoute
    attr_accessor :repeat, :skippable, :list
  end
  class MoveCommand
    attr_accessor :code, :parameters
  end
end

class Tone
  attr_accessor :red, :green, :blue, :gray
  def self._load(str)
    red, green, blue, gray = str.unpack('eeee') # 4 single-precision floats
    t = Tone.new
    t.red = red
    t.green = green
    t.blue = blue
    t.gray = gray
    t
  end
end

class Color
  attr_accessor :red, :green, :blue, :alpha
  def self._load(str)
    red, green, blue, alpha = str.unpack('eeee') # 4 single-precision floats
    c = Color.new
    c.red = red
    c.green = green
    c.blue = blue
    c.alpha = alpha
    c
  end
end

class Table
  attr_accessor :data
  def self._load(str)
    t = Table.new
    t.data = str
    t
  end
end

def to_json_val(obj)
  case obj
  when nil, Numeric, String, true, false
    obj
  when Array
    obj.map { |v| to_json_val(v) }
  when Hash
    new_h = {}
    obj.each do |k, v|
      new_k = k.to_s.start_with?('@') ? k.to_s[1..-1] : k.to_s
      new_h[new_k] = to_json_val(v)
    end
    new_h
  when Table
    { "@data" => obj.data.bytes }
  when Tone, Color
    # Represent Tone/Color as standard hashes if any exist
    new_h = {}
    obj.instance_variables.each do |ivar|
      new_k = ivar.to_s[1..-1]
      new_h[new_k] = to_json_val(obj.instance_variable_get(ivar))
    end
    new_h
  else
    # Any custom RPG class instance
    new_h = {}
    obj.instance_variables.each do |ivar|
      new_k = ivar.to_s[1..-1]
      new_h[new_k] = to_json_val(obj.instance_variable_get(ivar))
    end
    new_h
  end
end

# Load Map002
begin
  map = Marshal.load(File.binread('Data/Map002.rxdata'))
  serialized = to_json_val(map)
  File.write('scratch/Map002_test.json', JSON.pretty_generate(serialized))
  puts "Success! Map002 converted."
rescue => e
  puts "Error: #{e.class.name} - #{e.message}"
  puts e.backtrace.join("\n")
end
