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

#editor * {
  text-shadow: none;
}

.line {
  display: flex;
  flex-direction: row;
}
.line * {
  flex: 1;
}

.stack {
  display: flex;
  flex-direction: column;
}

.hidden {
  display: none;
}

.btn {
  margin-bottom: 0;
  border: 1px solid #333;
  padding: 5px;
  font-size: 15px;
  transition: none;
}

.btn:hover {
  font-size: 15px;
  background: #222;
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

  <div class="line">
    <button class="btn" id="toggle-pause">Toggle pause</button>
    <button class="btn" id="save-game">Save game</button>
  </div>
  
  <div class="line">
    <button class="btn" id="clear-plants">Clear plants</button>
    <button class="btn" id="spawn-plants">Spawn plants</button>
  </div>
  
  <div class="line">
    <button class="btn" id="get-player-position">Get player position</button>
    <button class="btn" id="move-player">Move player</button>
  </div>
  <button class="btn" id="regenerate-level">Regenerate level</button>

  <div class="line">
    <label><input type="radio" name="mode" value="edit">Edit</label>
    <label><input type="radio" name="mode" value="play">Play</label>
  </div>

  <label>
    Level
    <select id="level"> </select>
  </label>

  <label>
    Add
    <select id="object-type">
      <option value="">-</option>
      <option value="polygon">polygon</option>
      <option value="platform">platform</option>
      <option value="platformH1">platformH1</option>
      <option value="platformH2">platformH2</option>
      <option value="platformV1">platformV1</option>
      <option value="platformV2">platformV2</option>
      <option value="platformB1">platformB1</option>
      <option value="platformB2">platformB2</option>
      <option value="savepoint">save point</option> 
      <option value="crystal">crystal</option> 
      <option value="gravityCrystal">gravity crystal</option> 
      <option value="bubble">bubble</option> 
    </select>
  </label>

  <label id="deadly-input-label">
    Spikes
    <input id="deadly-input" type="checkbox">
  </label>
</div>

<label id="output-wrapper">
  <button class="btn" id="generate-level-string">Generate level string</button>
  Level string
  <textarea id="level-string" rows="15"></textarea>
  <button class="btn" id="close-editor">Close editor</button>
  </label>
`;
