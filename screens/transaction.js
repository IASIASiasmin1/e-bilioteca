import React, { Component } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Alert
} from "react-native";

import { BarCodeScanner } from "expo-barcode-scanner";
import db from "../config";
import * as Permissions from "expo-permissions";

const bgImage = require("../assets/background2.png");
const iconImage = require("../assets/appIcon.png");
const nameImage = require("../assets/appName.png");

export default class Transaction extends Component {
  constructor() {
    super();
    this.state = {
      domState: "normal",
      hasCameraPermissions: null,
      scanned: false,
      scannedData: "",
      bookID: "",
      studentID: "",
      bookName: "",
      studentName: "",
    };
  }

  getCameraPermissions = async (domState) => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({
      //se o status for granted o usuario tem permissão de câmera
      hasCameraPermissions: status == "granted",
      domState: domState,
      scanned: false,
    });
  };

  handleBarCodeScanner = async ({ type, data }) => {
    const { domState } = this.state;

    if (domState == "bookID") {
      this.setState({
        bookID: data,
        scanned: true,
        domState: "normal",
      });
    } else if (domState == "studentID") {
      this.setState({
        studentID: data,
        scanned: true,
        domState: "normal",
      });
    }
  };

  getBookDetails = async (bookID) => {
    bookID = bookID.trim();

    await db
      .collection("books")
      .where("book_id", "==", bookID)
      .get()
      .then((snapshot) => {
        snapshot.docs.map((doc) => {
          this.setState({
            bookName: doc.data().book_name,
          });
        });
      });
  };

  getStudentDetails = async (studentID) => {
    studentID = studentID.trim();

    await db
      .collection("students")
      .where("student_id", "==", studentID)
      .get()
      .then((snapshot) => {
        snapshot.docs.map((doc) => {
          this.setState({
            studentName: doc.data().student_name,
          });
        });
      });
  };

  handleTransaction = async () => {
    const { bookID, studentID } = this.state;
    this.getBookDetails(bookID);
    this.getStudentDetails(studentID);

    var transactionType = this.checkBookAvailability(bookID);

    if (transactionType == "issue") {
      var is_student_eligible = await this.checkStudentForIssue(studentID);

      if (is_student_eligible == true) {
        var { bookName, studentName } = this.state;
        this.initiateBookIssue(bookID, studentID, bookName, studentName);
        Alert.alert("Livro entregue para o aluno.");
      }
    } else if (transactionType == "return") {
      var is_student_eligible = await this.checkStudentForReturn(
        bookID,
        studentID
      );

      if (is_student_eligible == true) {
        var { bookName, studentName } = this.state;
        this.initiateBookReturn(bookID, studentID, bookName, studentName);
        Alert.alert("Livro devolvido à biblioteca.");
      }
    } else if (transactionType == false) {
      Alert.alert("O livro não existe no banco de dados da biblioteca.");
    }
  };

  initiateBookIssue = async (bookID, studentID, bookName, studentName) => {
    //adicionando a transação

    db.collection("transactions").add({
      student_id: studentID,
      student_name: studentName,
      book_id: bookID,
      book_name: bookName,
      date: firebase.firestore.Timestamp.now().toDate(),
      transaction_type: "issue",
    });

    //alterando o status do livro
    db.collection("books").doc(bookID).update({
      is_book_avaliable: false,
    });

    //alterando numero de livros retirados pelo aluno
    db.collection("students")
      .doc(studentID)
      .update({
        number_of_books_issued: firebase.firestore.Fieldvalue.increment(1),
      });
  };

  initiateBookReturn = (bookID, studentID, bookName, studentName) => {
    //adicionando a transação

    db.collection("transactions").add({
      student_id: studentID,
      student_name: studentName,
      book_id: bookID,
      book_name: bookName,
      date: firebase.firestore.Timestamp.now().toDate(),
      transaction_type: "return",
    });

    //alterando o status do livro
    db.collection("books").doc(bookID).update({
      is_book_avaliable: true,
    });

    //alterando numero de livros retirados pelo aluno
    db.collection("students")
      .doc(studentID)
      .update({
        number_of_books_issued: firebase.firestore.Fieldvalue.increment(-1),
      });
  };

  checkBookAvailability = async (bookID) => {
    const bookRef = await db
      .collection("books")
      .where("book_id", "==", bookID)
      .get();

    var transactionType = "";

    if (bookRef.docs.length == 0) {
      transactionType = false;
    } else {
      bookRef.docs.map((doc) => {
        //se o livro estiver disponível, o tipo de transação será "issue"
        //se não, será return
        transactionType = doc.data().is_book_avaliable ? "issue" : "return";
      });
    }
    return transactionType;
  };

  checkStudentForIssue = async (studentID) => {
    const studentRef = await db
      .collection("students")
      .where("student_id", "==", studentID)
      .get();

    var is_student_eligible = "";

    if (studentRef.docs.length == 0) {
      is_student_eligible = false;
      Alert.alert("O ID do aluno não está registrado.");
    } else {
      studentRef.docs.map((doc) => {
        if (doc.data().number_of_books_issued < 2) {
          is_student_eligible = true;
        } else {
          is_student_eligible = false;
          Alert.alert("O aluno já retirou 2 livros.");
        }
      });
    }
    return is_student_eligible;
  };

  checkStudentForReturn = async (bookID, studentID) => {
    const transactionRef = await db
      .collection("transactions")
      .where("book_id", "==", bookI)
      .limit(1)
      .get();

    var is_student_eligible = "";

    transactionRef.docs.map((doc) => {
      var lastBookTransaction = doc.data();

      if (lastBookTransaction.student_id == studentID) {
        is_student_eligible = true;
      } else {
        is_student_eligible = false;
        Alert.alert("O livro não foi retirado por esse aluno.");
      }
    });

    return is_student_eligible;
  };

  render() {
    const {
      domState,
      hasCameraPermissions,
      scannedData,
      scanned,
      bookID,
      studentID,
    } = this.state;
    if (domState !== "normal") {
      return (
        <BarCodeScanner
          style={StyleSheet.absoluteFillObject}
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanner}
        />
      );
    }
    return (
      <KeyboardAvoidingView behavior={"padding"} style={styles.container}>
        <ImageBackground source={bgImage} style={styles.bgImage}>
          <View style={styles.upperContainer}>
            <Image source={iconImage} style={styles.appIcon}></Image>
            <Image source={nameImage} style={styles.appName}></Image>
          </View>
          <View style={styles.lowerContainer}>
            <View style={styles.textinputContainer}>
              <TextInput
                style={styles.textinput}
                placeholder={"ID do livro"}
                placeholderTextColor={"#FFFFFF"}
                value={bookID}
                onChangeText={(text) => {
                  this.setState({ bookID: text });
                }}
              />
              <TouchableOpacity
                style={styles.scanbutton}
                onPress={() => this.getCameraPermissions("bookID")}
              >
                <Text style={styles.scanbuttonText}>Scanear</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.textinputContainer}>
              <TextInput
                style={styles.textinput}
                placeholder={"ID do aluno"}
                placeholderTextColor={"#FFFFFF"}
                value={studentID}
                onChangeText={(text) => {
                  this.setState({ studentID: text });
                }}
              />
              <TouchableOpacity
                style={styles.scanbutton}
                onPress={() => this.getCameraPermissions("studentID")}
              >
                <Text style={styles.scanbuttonText}>Scanear</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => this.handleTransaction}
              style={styles.button}
            >
              <Text style={styles.scanbuttonText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#5653D4",
  },

  text: {
    color: "#FFFFFF",
    fontSize: 30,
  },

  button: {
    width: "43%",
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    backgroundColor: "#F48D20",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 24,
  },

  lowerContainer: {
    flex: 0.5,
    alignItems: "center",
  },

  textinputContainer: {
    borderWidth: 2,
    borderRadius: 10,
    flexDirection: "row",
    backgroundColor: "#9DFD24",
    borderColor: "#FFFFFF",
  },

  textinput: {
    width: "57%",
    height: 50,
    padding: 10,
    borderColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 3,
    fontSize: 18,
    backgroundColor: "#5653D4",
    color: "#FFFFFF",
  },

  scanbutton: {
    width: 100,
    height: 50,
    backgroundColor: "#9DFD24",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  scanbuttonText: {
    fontSize: 24,
    color: "#0A0101",
  },

  bgImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },

  upperContainer: {
    flex: 0.5,
    justifyContent: "center",
    alignItems: "center",
  },
  appIcon: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginTop: 80,
  },
  appName: {
    width: 180,
    resizeMode: "contain",
  },

  scanbutton: {
    width: 100,
    height: 50,
    backgroundColor: "#9DFD24",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  scanbuttonText: {
    fontSize: 20,
    color: "#0A0101",
  },
});
