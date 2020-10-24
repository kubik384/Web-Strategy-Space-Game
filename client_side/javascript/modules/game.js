"use strict"

class Game {
    constructor(socket) {
        this.socket = socket;
        this.lastUpdateTime;
        this.updateLoop;
        this.resource_prods;
        this.resources;
        this.buildings;
    }

    async display_starter_datapack(p_starter_datapack) {
        var starter_datapack = JSON.parse(p_starter_datapack);
        console.log(starter_datapack);
        this.resources = starter_datapack.resources[0];
        this.buildings = starter_datapack.building_details;
        this.resource_prods = starter_datapack.resource_prods[0];

        for (var i = 0; i < starter_datapack.buildings.length; i++) {
            this.buildings[i].upgrade_start = starter_datapack.buildings.find(b => b.building_id == this.buildings[i].building_id).upgrade_start;
        }
        for (var resource_type in this.resources) {
            this.update_resource_ui(resource_type, Math.floor(this.resources[resource_type]) + ' (' + this.resource_prods[resource_type] + '/s)');
        }
        for (var i = 0; i < this.buildings.length; i++) {
            this.update_building_ui(this.buildings[i].name, this.buildings[i].level, this.buildings[i].upgrade_time, this.buildings[i].upgrade_start);
        }

        this.lastUpdateTime = Math.floor(Date.now()/1000);
        this.updateLoop = setInterval(this.update_game.bind(this), 1000);
    }

    update_game() {
        var currTime = Math.floor(Date.now()/1000);
        var timePassed = currTime - this.lastUpdateTime;
        for (var resource_type in this.resource_prods) {
            this.resources[resource_type] += this.resource_prods[resource_type] * timePassed;
            this.update_resource_ui(resource_type, Math.floor(this.resources[resource_type]) + ' (' + this.resource_prods[resource_type] + '/s)');
        }
        
        for (var i = 0; i < this.buildings.length; i++) {
            if (this.buildings[i].upgrade_start !== null) {
                if (this.buildings[i].upgrade_start + this.buildings[i].building_time - Date.now() <= 0) {
                    this.buildings[i].level++;
                    this.buildings[i].upgrade_start = null;
                }
                this.update_building_ui(this.buildings[i].name, this.buildings[i].level, this.buildings[i].upgrade_time, this.buildings[i].upgrade_start);
            }
        }
        this.lastUpdateTime = currTime;
    }

    async process_incoming_message(message) {
        console.log(message);
    }

    async request_data() {
        this.socket.emit('login_player', document.cookie.split('token=')[1]);
    }

    async update_resource(resource, amount) {
        this.socket.emit('update_resource', JSON.stringify({resource: resource, amount: amount}));
        this.resources[resource] += amount;
        this.update_resource_ui(resource, Math.floor(this.resources[resource]));
        
    }

    async upgrade_building(p_building) {
        this.socket.emit('upgrade_building', p_building);
        var building_index = this.buildings.findIndex(building => { if (building.name == p_building) { return true; } });
        this.update_building_ui(p_building, this.buildings[building_index].level, this.buildings[building_index].timeLeft);
    }

    async update_resource_ui(id, innerHTML) {
        document.getElementById(id).innerHTML = innerHTML;
    }

    async update_building_ui(name, level, upgrade_time, upgrade_start) {
        var building_time = (upgrade_start !== null ? (upgrade_start + upgrade_time - Math.floor(Date.now() / 1000)) : 0);
        var innerHTML = level + (building_time != 0 ? (', Upgrading: ' + building_time + 's') : '');
        document.getElementById(name).innerHTML = innerHTML;
    }
}

export { Game };