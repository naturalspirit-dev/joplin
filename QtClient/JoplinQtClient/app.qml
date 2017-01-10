import QtQuick 2.7
import QtQuick.Controls 2.0
import QtQuick.Controls 1.4
import QtQuick.Layouts 1.0

Item {
	id: root
	width: 800
	height: 600
	signal currentFolderChanged()
	signal currentNoteChanged()
	signal addNoteButtonClicked()
	signal addFolderButtonClicked()
	signal syncButtonClicked()
	signal loginButtonClicked()
	property alias currentFolderIndex: mainPage.currentFolderIndex
	property alias currentNoteIndex: mainPage.currentNoteIndex

	property var pages : ({})

	function pageByName(pageName) {
		if (root.pages[pageName]) return root.pages[pageName];

		var page = null;
		if (pageName === "main") {
			page = mainPage
		} else if (pageName === "login") {
			var s = '
                LoginPage {
                    id: loginPage
                    anchors.fill: parent
                    visible: false
                    appRoot: root
                }';
			page = Qt.createQmlObject(s, root);
		}

		root.pages[pageName] = page;

		return page;
	}

	function showPage(pageName) {
		for (var n in root.pages) {
			root.pages[n].visible = false;
		}

		print("Switching to page: " + pageName);
		var page = pageByName(pageName);
		page.visible = true;
	}

	MainPage {
		id: mainPage
		anchors.fill: parent
		appRoot: root
		visible: false
	}

}
