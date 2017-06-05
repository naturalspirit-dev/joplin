import { BaseModel } from 'src/base-model.js';
import { Log } from 'src/log.js';
import { Geolocation } from 'src/geolocation.js';

class Note extends BaseModel {

	static tableName() {
		return 'notes';
	}

	static useUuid() {
		return true;
	}

	static itemType() {
		return BaseModel.ITEM_TYPE_NOTE;
	}

	static trackChanges() {
		return true;
	}

	static new(parentId = '') {
		let output = super.new();
		output.parent_id = parentId;
		return output;
	}

	static newTodo(parentId = '') {
		let output = this.new(parentId);
		output.is_todo = true;
		return output;
	}

	static previewFieldsSql() {
		return '`id`, `title`, `body`, `is_todo`, `todo_completed`, `parent_id`, `updated_time`'
	}

	static previews(parentId) {
		return this.db().selectAll('SELECT ' + this.previewFieldsSql() + ' FROM notes WHERE parent_id = ?', [parentId]).then((r) => {
			let output = [];
			for (let i = 0; i < r.rows.length; i++) {
				output.push(r.rows.item(i));
			}
			return output;
		});
	}

	static preview(noteId) {
		return this.db().selectOne('SELECT ' + this.previewFieldsSql() + ' FROM notes WHERE id = ?', [noteId]);
	}

	static updateGeolocation(noteId) {
		Log.info('Updating lat/long of note ' + noteId);

		let geoData = null;
		return Geolocation.currentPosition().then((data) => {
			Log.info('Got lat/long');
			geoData = data;
			return Note.load(noteId);
		}).then((note) => {
			if (!note) return; // Race condition - note has been deleted in the meantime
			note.longitude = geoData.coords.longitude;
			note.latitude = geoData.coords.latitude;
			note.altitude = geoData.coords.altitude;
			return Note.save(note);
		}).catch((error) => {
			Log.info('Cannot get location:', error);
		});
	}

	static save(o, options = null) {
		return super.save(o, options).then((result) => {
			// 'result' could be a partial one at this point (if, for example, only one property of it was saved)
			// so call this.preview() so that the right fields are populated.
			return this.preview(result.id);
		}).then((note) => {
			this.dispatch({
				type: 'NOTES_UPDATE_ONE',
				note: note,
			});
			return note;
		});
	}

}

export { Note };