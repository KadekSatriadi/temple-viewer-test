import * as pc from "playcanvas";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("hey");
  const appElement = await document.querySelector("pc-app").ready();
  const app = await appElement.app;

  const entityElement = await document
    .querySelector('pc-entity[name="camera"]')
    .ready();
  const entity = entityElement.entity;

  const resetPosition = null;
  const resetTarget = null;
  const templeInfoAsset = app.assets.find('temple-info');
  const logoAsset = app.assets.find("logo");
  console.log(logoAsset);

  function createInformationPanel(bbox, templeInfo) {
    // Create text
    console.log(app);
    // During asset preloading
    app.assets.loadFromUrl(
      "./assets/Roboto-Black.json",
      "font",
      function (err, asset) {
        //console.log(asset.id);
        const fontAssetId = asset.id;
        //Parameters
        const panelScale = 0.003;
        const mainTextFontSize = 16;
        const secondaryTextFontSize = 8;
        const bodyTextFontSize = 6;
        const footerTextFontSize = 3;
        const mainSecSpace = -10;
        const secTerSpace = mainSecSpace - 8;
        const bspace = 6;

        const logoConfig = {
            width: 468, 
            height: 276, 
            scale: 0.2,
            localPosition:{
                x: -100, y: -35, z:0
            }
        }

        const textConfig = {
            type:  pc.ELEMENTTYPE_TEXT,
            color: new pc.Color(1, 1, 1),
            opacity: 1,
            outlineColor: new pc.Color(0.2,0.2,0.2),
            outlineThickness: 0.001,
            fontAsset: fontAssetId,
            wrapLines: true,
            anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5), // centered anchor
        };

        function createTextEntity(config, name, text, fontSize){
            const entity = new pc.Entity(name);
            const elm = entity.addComponent("element", config);
            elm.text = text;
            elm.fontSize = fontSize;
            return {
                entity: entity,
                elm: elm
            }
        }

        // Create Logo
        const logoEntity = new pc.Entity("logo");
        logoEntity.addComponent("element", {
            type: pc.ELEMENTTYPE_IMAGE,
            textureAsset: logoAsset.id,
            width: logoConfig.width * logoConfig.scale,
            height: logoConfig.height * logoConfig.scale
        })

        // Create Parent
        const panelParent = new pc.Entity("InfoPanel");
        const mainTextEntity = createTextEntity(textConfig, "main", templeInfo.name, mainTextFontSize).entity;
        const secondaryTextEntity = createTextEntity(textConfig, "second", templeInfo.type, secondaryTextFontSize).entity;
        const body1 = createTextEntity(textConfig, "body1", templeInfo.description, bodyTextFontSize).entity;
        const body2 = createTextEntity(textConfig, "body2", `Dikontribusikan oleh ${templeInfo.contributor}`, bodyTextFontSize).entity;
        const body3 = createTextEntity(textConfig, "body3", `Pada tanggal ${templeInfo.contributiondate}`, bodyTextFontSize).entity;
        const body4 = createTextEntity(textConfig, "body4", `Pura terletak di ${templeInfo.address}`, bodyTextFontSize).entity;

        const footer = createTextEntity(textConfig, "body4", `PID: ${templeInfo.PID}`, footerTextFontSize).entity;

        // Add to parent
        panelParent.setLocalScale(panelScale, panelScale, panelScale);
        panelParent.setEulerAngles(0, 180, 180);
        panelParent.addChild(logoEntity);
        panelParent.addChild(mainTextEntity);
        panelParent.addChild(secondaryTextEntity);
        panelParent.addChild(body1);
        panelParent.addChild(body2);
        panelParent.addChild(body3);
        panelParent.addChild(body4);
        panelParent.addChild(footer);


        // Set scale and pos
        mainTextEntity.setLocalPosition(0, 0, 0);
        secondaryTextEntity.setLocalPosition(0, mainSecSpace, 0);
        body1.setLocalPosition(0, secTerSpace, 0);
        body2.setLocalPosition(0, secTerSpace - (bspace * 1), 0);
        body3.setLocalPosition(0, secTerSpace - (bspace * 2), 0);
        body4.setLocalPosition(0, secTerSpace - (bspace * 3), 0);
        footer.setLocalPosition(0, secTerSpace - (bspace * 4), 0);
        logoEntity.setLocalPosition(logoConfig.localPosition.x, logoConfig.localPosition.y, logoConfig.localPosition.z);

        const splatEntity = app.root.findByName("splat");
        if (splatEntity) {
          splatEntity.addChild(panelParent);
          panelParent.setLocalPosition(0, -bbox.halfExtents.y * 0.5, -bbox.halfExtents.z);
        }
      }
    );
    //end create text
  }

  class FrameScene extends pc.Script {
    frameScene(bbox) {
      const sceneSize = bbox.halfExtents.length();
      const distance =
        sceneSize / Math.sin((this.entity.camera.fov / 180) * Math.PI * 0.5);
      this.entity.script.cameraControls.sceneSize = sceneSize;
      this.entity.script.cameraControls.focus(
        bbox.center,
        new pc.Vec3(2, 1, 2).normalize().mulScalar(distance).add(bbox.center)
      );
    }

    resetCamera(bbox) {
      const sceneSize = bbox.halfExtents.length();
      this.entity.script.cameraControls.sceneSize = sceneSize * 0.2;
      this.entity.script.cameraControls.focus(
        resetTarget ?? pc.Vec3.ZERO,
        resetPosition ?? new pc.Vec3(2, 1, 2)
      );
    }

    calcBound() {
      const gsplatComponents = this.app.root.findComponents("gsplat");
      return (
        gsplatComponents?.[0]?.instance?.meshInstance?.aabb ??
        new pc.BoundingBox()
      );
    }

    initCamera() {
      document.getElementById("loadingIndicator").classList.add("hidden");

      const bbox = this.calcBound();

      // configure camera
      this.entity.camera.horizontalFov = true;
      this.entity.camera.farClip = bbox.halfExtents.length() * 20;
      this.entity.camera.nearClip = this.entity.camera.farClip * 0.001;
      this.entity.camera.toneMapping = 6;

      if (bbox.halfExtents.length() > 100 || resetPosition || resetTarget) {
        this.resetCamera(bbox);
      } else {
        this.frameScene(bbox);
      }

      window.addEventListener("keydown", (e) => {
        switch (e.key) {
          case "f":
            this.frameScene(bbox);
            break;
          case "r":
            this.resetCamera(bbox);
            break;
        }
      });

      console.log(templeInfoAsset);
      if (templeInfoAsset.loaded) {
        console.log(templeInfoAsset.resources[0])
        createInformationPanel(bbox, templeInfoAsset.resources[0]);
    } 

    }

    postInitialize() {
      const assets = this.app.assets.filter((asset) => asset.type === "gsplat");
      if (assets.length > 0) {
        const asset = assets[0];
        if (asset.loaded) {
          this.initCamera();
        } else {
          asset.on("load", () => {
            this.initCamera();
          });
        }
      }
    }
  }

  entity.script.create(FrameScene);

  // Create container for buttons
  const container = document.createElement("div");
  Object.assign(container.style, {
    position: "absolute",
    bottom: "max(16px, env(safe-area-inset-bottom))",
    right: "max(16px, env(safe-area-inset-right))",
    display: "flex",
    gap: "8px",
  });

  function createButton({ icon, title, onClick }) {
    const button = document.createElement("button");
    button.innerHTML = icon;
    button.title = title;

    Object.assign(button.style, {
      display: "flex",
      position: "relative",
      width: "40px",
      height: "40px",
      background: "rgba(255, 255, 255, 0.9)",
      border: "1px solid #ddd",
      borderRadius: "8px",
      cursor: "pointer",
      alignItems: "center",
      justifyContent: "center",
      padding: "0",
      margin: "0",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      transition: "background-color 0.2s",
      color: "#2c3e50",
    });

    const svg = button.querySelector("svg");
    if (svg) {
      svg.style.display = "block";
      svg.style.margin = "auto";
    }

    button.onmouseenter = () => {
      button.style.background = "rgba(255, 255, 255, 1)";
    };

    button.onmouseleave = () => {
      button.style.background = "rgba(255, 255, 255, 0.9)";
    };

    if (onClick) button.onclick = onClick;

    return button;
  }

  // Add VR button if available
  if (app.xr.isAvailable("immersive-vr")) {
    const vrButton = createButton({
      icon: `<svg width="32" height="32" viewBox="0 0 48 48">
                <path d="M30,34 L26,30 L22,30 L18,34 L14,34 C11.7908610,34 10,32.2091390 10,30 L10,18 C10,15.7908610 11.7908610,14 14,14 L34,14 C36.2091390,14 38,15.7908610 38,18 L38,30 C38,32.2091390 36.2091390,34 34,34 L30,34 Z M44,28 C44,29.1045694 43.1045694,30 42,30 C40.8954306,30 40,29.1045694 40,28 L40,20 C40,18.8954305 40.8954306,18 42,18 C43.1045694,18 44,18.8954305 44,20 L44,28 Z M8,28 C8,29.1045694 7.10456940,30 6,30 C4.89543060,30 4,29.1045694 4,28 L4,20 C4,18.8954305 4.89543060,18 6,18 C7.10456940,18 8,18.8954305 8,20 L8,28 Z" fill="currentColor">
            </svg>`,
      title: "Enter VR",
      onClick: () =>
        app.xr.start(
          app.root.findComponent("camera"),
          "immersive-vr",
          "local-floor"
        ),
    });
    container.appendChild(vrButton);
  }

  // Add AR button if available
  if (app.xr.isAvailable("immersive-ar")) {
    const arButton = createButton({
      icon: `<svg width="32" height="32" viewBox="0 0 24 24">
                <path d="M9.5,6.5v3h-3v-3H9.5 M11,5H5v6h6V5L11,5z M9.5,14.5v3h-3v-3H9.5 M11,13H5v6h6V13L11,13z M17.5,6.5v3h-3v-3H17.5 M19,5h-6v6h6V5L19,5z M13,13h1.5v1.5H13V13z M14.5,14.5H16V16h-1.5V14.5z M16,13h1.5v1.5H16V13z M17.5,14.5H19V16h-1.5V14.5z M16,16h1.5v1.5H16V16z M17.5,17.5H19V19h-1.5V17.5z M13,16h1.5v1.5H13V16z M14.5,17.5H16V19h-1.5V17.5z M13,19h1.5v1.5H13V19z M14.5,20.5H16V22h-1.5V20.5z M16,19h1.5v1.5H16V19z M17.5,20.5H19V22h-1.5V20.5z" fill="currentColor"/>
            </svg>`,
      title: "Enter AR",
      onClick: async () => {
        try {
          app.xr.start(
            app.root.findComponent("camera"),
            "immersive-ar",
            "local-floor"
          );
        } catch (err) {
          alert("AR session request failed:", err);
        }
      },
    });
    container.appendChild(arButton);
  }

  // Add exit XR handler
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      app.xr.end();
    }
  });

  // Add fullscreen button if supported
  if (document.documentElement.requestFullscreen && document.exitFullscreen) {
    const enterFullscreenIcon = `<svg width="32" height="32" viewBox="0 0 24 24">
            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="currentColor"/>
        </svg>`;
    const exitFullscreenIcon = `<svg width="32" height="32" viewBox="0 0 24 24">
            <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" fill="currentColor"/>
        </svg>`;

    const fullscreenButton = createButton({
      icon: enterFullscreenIcon,
      title: "Toggle Fullscreen",
      onClick: () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      },
    });

    document.addEventListener("fullscreenchange", () => {
      fullscreenButton.innerHTML = document.fullscreenElement
        ? exitFullscreenIcon
        : enterFullscreenIcon;
      fullscreenButton.title = document.fullscreenElement
        ? "Exit Fullscreen"
        : "Enter Fullscreen";
    });

    container.appendChild(fullscreenButton);
  }

  // Add info button
  const infoButton = createButton({
    icon: `<svg width="32" height="32" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
        </svg>`,
    title: "Show Controls",
    onClick: () => {
      const infoPanel = document.getElementById("infoPanel");
      infoPanel.classList.toggle("hidden");
    },
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.getElementById("infoPanel").classList.add("hidden");
    }
  });

  container.appendChild(infoButton);
  document.body.appendChild(container);
});
