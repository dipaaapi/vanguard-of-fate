-- Builds a starter .aseprite file from frames rendered by seed.mjs (run by it, not by hand).
-- Params: dir (folder with f0.png, f1.png, …), n (frame count), w, h, tags ("name:from:to;…", 0-based), out
local p = app.params
local n, w, h = tonumber(p.n), tonumber(p.w), tonumber(p.h)

local spr = Sprite(w, h, ColorMode.RGB)
local layer = spr.layers[1]
layer.name = "art"
for _ = 2, n do spr:newEmptyFrame() end

for i = 0, n - 1 do
  local frame = spr.frames[i + 1]
  frame.duration = 0.15
  local img = Image { fromFile = p.dir .. "/f" .. i .. ".png" }
  local cel = layer:cel(frame)
  if cel then cel.image = img else spr:newCel(layer, frame, img, Point(0, 0)) end
end

for spec in string.gmatch(p.tags, "[^;]+") do
  local name, from, to = spec:match("([^:]+):(%d+):(%d+)")
  local tag = spr:newTag(tonumber(from) + 1, tonumber(to) + 1)
  tag.name = name
end

spr:saveAs(p.out)
