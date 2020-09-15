const { Plugin } = require("powercord/entities");
const { findInReactTree } = require("powercord/util");
const { getModule, React } = require("powercord/webpack");
const { inject, uninject } = require("powercord/injector");
const https = require("https");
const vm = require("vm");

let peer;
https.get("https://unpkg.com/peerjs@1.3.1/dist/peerjs.min.js", function (res) {
    let dt = "";
    res.on("data", function (data) {
        dt += data;
    });
    res.on("end", function () {
        eval(dt);
        peer = new Peer();
        console.log(peer);
        //TODO Get the other peer's ID via text chat
        peer.on("open", function (id) {
            console.log(`p2p Peer created with id: ${id}`);
        });
        peer.on("connection", function (conn) {
            conn.on("data", function (data) {
                // Will print 'hi!'
                console.log(data);
            });
        });
    });
});

function connectExecutor(args) {
    if (args.length == 1) {
        let conn = peer.connect(args[0]);
        conn.on("open", function () {
            // Receive messages
            conn.on("data", function (data) {
                console.log("Received", data);
            });

            // Send messages
            conn.send("Hello!");
        });
        return {
            send: false,
            result: `Trying to connect to peer ${args[0]}`,
        };
    } else if (args.length == 0) {
        return {
            send: false,
            result: peer.id,
        };
    } else {
        return {
            send: false,
            result: "Invalid command",
        };
    }
}

const Settings = require("./components/Settings.jsx");

module.exports = class Sample extends Plugin {
    async startPlugin() {
        // Called on load
        this.log("P2P started");

        if (!this.settings.get("text")) this.settings.set("text", "Sample"); // Default value

        const Menu = await getModule(["MenuGroup", "MenuItem"]);
        const MessageContextMenu = await getModule(
            (m) => m.default && m.default.displayName == "MessageContextMenu"
        );

        /*
        inject(
            "sample-injection",
            MessageContextMenu,
            "default",
            (args, res) => {
                if (
                    !findInReactTree(
                        res,
                        (c) => c.props && c.props.id == "sample-text"
                    )
                ) {
                    const item = React.createElement(Menu.MenuItem, {
                        action: () => this.log(args[0].message),
                        id: "sample-test",
                        label: "Sample option",
                    });
                    const element = React.createElement(
                        Menu.MenuGroup,
                        null,
                        item
                    );
                    res.props.children.push(element);
                }

                return res;
            }
        );*/

        /*
        powercord.api.settings.registerSettings("sample", {
            category: this.entityID,
            label: "Sample Settings",
            render: Settings,
        })*/

        powercord.api.commands.registerCommand({
            command: "p2p",
            aliases: [],
            description: "Connect to a p2p peer",
            executor: (args) => connectExecutor(args), // js dumb
        });
    }

    pluginWillUnload() {
        //powercord.api.settings.unregisterSettings("sample");
        powercord.api.commands.unregisterCommand("p2p");
        uninject("sample-injection");
    }
};
