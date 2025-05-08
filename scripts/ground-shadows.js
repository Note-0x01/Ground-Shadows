import { injectConfig } from "./injectConfig.js";

class ShadowToken extends CONFIG.Token.objectClass {
  /**
   * The target marker, which indicates that this Token is targeted by this User or others.
   * @type {PIXI.Sprite}
   */
  shadow;

  _isShadowEnabledAndInit() {
    return this.document.flags.groundShadow
    ? this.document.flags.groundShadow.enabled
    : false
  }

  _drawShadow(tokenConfig) {
    const shadowSettings = tokenConfig.groundShadow

    const {width, height} = this.getSize();
    const anchorX = this.document.texture.anchorX
    const anchorY = this.document.texture.anchorY

    this.shadow.anchor.set(0.5, 0.5)
    this.shadow.height = height/3 + shadowSettings.height
    this.shadow.width = width + 20 + shadowSettings.width 
    this.shadow.x = (width/2 - width/2 * (anchorX - 0.5)) + shadowSettings.x * (width/100)
    this.shadow.y = (height - height * (anchorY - 0.5) - 5) + shadowSettings.y
    this.shadow.alpha = shadowSettings.opacity / 100

  }

  /** @override */
    async _draw(options) {

        if(this._isShadowEnabledAndInit()) {
            if(!(this.shadow instanceof PIXI.Sprite)) {
                this.shadow = new PIXI.Sprite(await loadTexture("modules/Ground-Shadows/assets/shadow.png"))
                this._drawShadow(this.document.flags)
                this.addChildAt(this.shadow, 0)
            }
            this.shadow.visible = true
            return super._draw(options)
        }

        if (this.shadow instanceof PIXI.Sprite) {
            this.shadow.visible = false
        }

        return super._draw(options)
    }

    /** @override */
    _refreshShape() {
        if(this._isShadowEnabledAndInit() && this.shadow instanceof PIXI.Sprite)
            this._drawShadow(this.document.flags)

        return super._refreshShape()
    }

    /** @inheritDoc */
    _onUpdate(changed, options, userId) {
      super._onUpdate(changed, options, userId)

      const flagsChanged = "flags" in changed
      const shadowChanged = flagsChanged && "groundShadow" in changed.flags;
      const shadowEnabledChanged = shadowChanged && ("enabled" in changed.flags.groundShadow)

      this.renderFlags.set({
          redraw: shadowEnabledChanged,
          refreshShape: shadowChanged
      })
    }
}

Hooks.once('init', async function () {
    console.log("Loading Ground Shadows...");
    CONFIG.Token.objectClass = ShadowToken
});

Hooks.on("renderTokenConfig", async (tokenConfig,html) => {
    const moduleId = "groundShadows";
    const tab = {
        name: moduleId,
        label: "Shadows",
        icon: "fas fa-moon",
    };

    injectConfig.inject(tokenConfig, html, {moduleId, tab}, tokenConfig.object)

    const posTab = html.find(`.tab[data-tab="${moduleId}"]`);
    const tokenFlags = tokenConfig.options.sheetConfig
    ? tokenConfig.object.flags?.groundShadow
    : tokenConfig.token.flags?.groundShadow

    const data = {
        enabled: tokenFlags?.enabled ? "checked" : "",
        width: tokenFlags?.width ? tokenFlags.width : 0,
        height: tokenFlags?.height ? tokenFlags.height : 0,
        xOffset: tokenFlags?.x ? tokenFlags.x : 0,
        yOffset: tokenFlags?.y ? tokenFlags.y : 0,
        opacity: tokenFlags?.opacity ? tokenFlags.opacity : 80
    }

    console.log(tokenFlags)

    const insertHTML = await renderTemplate('modules/Ground-Shadows/templates/token-config.html', data);
    posTab.append(insertHTML)
});