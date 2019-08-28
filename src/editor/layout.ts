export const EDITOR_STYLES = `
body {
  display: flex;
  background-color: #555;
} 

canvas.with-cursor {
  cursor: initial;
}

#editor {
  display: flex;
  flex-direction: column;
  padding: 10px;
  color: white;
  min-width: 300px;
  background-color: #333;
}

.line {
  display: flex;
}

.stack {
  display: flex;
  flex-direction: column;
}

#content {
  flex: 1;
}

#output-wrapper {
  display: flex;
  flex-direction: column;
}
`;

export const EDITOR_HTML = `
<h3>Editor</h3>

<div id="content">
  <div class="stack">
    <label>
      <input id="draw-colision-helpers" type="checkbox">
      Draw colision helpers
    </label>

    <label>
      <input id="draw-plants-helpers" type="checkbox">
      Draw plants helpers
    </label>
  </div>

  <button id="toggle-pause">Toggle pause</button>
  <button id="clear-plants">Clear plants</button>
  <button id="spawn-plants">Spawn plants</button>
  <button id="get-player-position">Get player position</button>
  <button id="move-player">Move player</button>
  <button id="regenerate-level">Regenerate level</button>

  <div class="line">
    <label><input type="radio" name="mode" value="edit">Edit</label>
    <label><input type="radio" name="mode" value="draw">Draw</label>
    <label><input type="radio" name="mode" value="place">Place</label>
    <label><input type="radio" name="mode" value="play">Play</label>
  </div>

  <label>
    Add
    <select id="object-type">
      <option value="">-</option>
      <option value="polygon">polygon</option>
      <option value="platform">platform</option>
      <option value="hPlatform1">hPlatform1</option>
      <option value="hPlatform2">hPlatform2</option>
      <option value="vPlatform1">vPlatform1</option>
      <option value="vPlatform2">vPlatform2</option>
    </select>
  </label>
</div>

<label id="output-wrapper">
  <button id="generate-level-string">Generate level string</button>
  Level string
  <textarea id="level-string" rows="5"></textarea>
  <button id="close-editor">Close editor</button>
  </label>
`;
