<?php
session_start();

//Si el usuario no esta logeado lo enviamos al login
if (!$_SESSION['usuarioLogeado']) {
    header("Location:login.php");
}

include("funciones.php");


//Se presióno el botón Nuevo Tema
if (isset($_GET['nuevoTema'])) {
    //tomamos los datos que vienen del formulario
    $tema = $_GET['nombreTema'];
    $mensaje = agregarNuevoTema($tema);
    header("Location: nuevapregunta.php");
}
/******************************************************* */
//GUARDAMOS LA PREGUNTA
if (isset($_POST['guardar'])) {
    //nos conectamos a la base de datos
    include("conexion.php");

    //tomamos los datos que vienen del fosrmulario
    // elimina texto con formato de etiqueta html
    $pregunta = htmlspecialchars($_POST['pregunta']);
    $opcion_a = htmlspecialchars($_POST['opcion_a']);
    $opcion_b = htmlspecialchars($_POST['opcion_b']);
    $opcion_c = htmlspecialchars($_POST['opcion_c']);
    $opcion_d = htmlspecialchars($_POST['opcion_d']);
    $id_tema = $_POST['tema'];
    $correcta = $_POST['correcta'];
    // $imagena = $_POST['imagenalex'];

    $imgFile = $_FILES['imagenalex']['name'];
    $tmp_dir = $_FILES['imagenalex']['tmp_name'];
    $imgSize = $_FILES['imagenalex']['size'];

    $upload_dir = 'imagenes/';
    $imgExt = strtolower(pathinfo($imgFile, PATHINFO_EXTENSION));
    $valid_extensions = array('jpeg', 'jpg', 'png', 'gif');
    $userpic = rand(1000, 1000000) . "." . $imgExt;

    if (in_array($imgExt, $valid_extensions)) {
        if ($imgSize < 1000000) {
            move_uploaded_file($tmp_dir, $upload_dir . $userpic);
        } else {
            $errMSG = "Su archivo es muy grande.";
        }
    } else {
        $errMSG = "Solo archivos JPG, JPEG, PNG & GIF son permitidos.";
    }

    //Armamos el query para insertar en la tabla preguntas
    $query = "INSERT INTO preguntas (id, tema, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, correcta,imagenes)
    VALUES (NULL, '$id_tema','$pregunta', '$opcion_a','$opcion_b','$opcion_c','$opcion_d','$correcta','$userpic')";

    //insertamos en la tabla preguntas
    if (mysqli_query($conn, $query)) { //Se insertó correctamente
        $mensaje = "La pregunta se inserto correctamente";
    } else {
        $mensaje = "No se pudo insertar en la BD" . mysqli_error($conn);
    }
}

//Obtengo todos los temas de la bd
$resltado_temas = obetenerTodosLosTemas();


?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css" integrity="sha512-KfkfwYDsLkIlwQp6LFnl8zNdLGxu9YAA1QvwINks4PhcElQSvqcyVLLD9aMhXd13uQjoXtEKNosOWaZqXgel0g==" crossorigin="anonymous" referrerpolicy="no-referrer" />

    <link rel="stylesheet" href="estilo.css">
    <title>Quiz Game</title>
</head>

<body>
    <div class="contenedor">
        <header>
            <h1>Eus3 Simulador</h1>
        </header>
        <div class="contenedor-info">
            <?php include("nav.php") ?>
            <div class="panel">
                <h2>Complete la Pregunta</h2>
                <hr>
                <section id="nuevaPregunta">
                    <!-- <form action="<?php echo $_SERVER['PHP_SELF'] ?>" method="get"> -->
                    <form method="post" enctype="multipart/form-data">
                        <div class="fila">
                            <label for="">Tema: </label>
                            <select name="tema" id="tema">
                                <?php while ($row = mysqli_fetch_assoc($resltado_temas)) : ?>
                                    <option value="<?php echo $row['id'] ?>">
                                        <?php echo $row['nombre'] ?>
                                    </option>
                                <?php endwhile ?>
                            </select>
                            <span class="agregarTema" onclick="agregarTema()">
                                <i class="fa-solid fa-circle-plus"></i></span>
                        </div>
                        <div class="fila">
                            <label for="">Pregunta:</label>
                            <textarea name="pregunta" id="" cols="30" rows="10" required></textarea>
                        </div>
                        <div class="fila">
                            <label for="">Imagen:</label>
                            <input type="file" name="imagenalex" id="" cols="30" rows="10" >
                        </div>
                        <div class="opciones">
                            <div class="opcion">
                                <label for="">Opcion A</label>
                                <input type="text" name="opcion_a" id="" required>
                            </div>
                            <div class="opcion">
                                <label for="">Opcion B</label>
                                <input type="text" name="opcion_b" required>
                            </div>
                            <div class="opcion">
                                <label for="">Opcion C</label>
                                <input type="text" name="opcion_c" required>
                            </div>
                            <div class="opcion">
                                <label for="">Opcion D</label>
                                <input type="text" name="opcion_d" required>
                            </div>
                        </div>
                        <div class="opcion">
                            <label for="">Correcta</label>
                            <select name="correcta" id="" class="correcta">
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                            </select>
                        </div>
                        <hr>
                        <input type="submit" value="Guardar Pregunta" name="guardar" class="btn-guardar">
                    </form>

                    <?php if (isset($_POST['guardar'])) : ?>
                        <span> <?php echo $mensaje ?></span>
                    <?php endif ?>
                </section>
            </div>
        </div>
    </div>



    <!-- Ventana Modal para nuevo Tema -->
    <div id="modalTema" class="modal">
        <!-- Modal content -->
        <div class="modal-content">
            <span class="close" onclick="cerrarTema()">&times;</span>
            <form action="<?php echo $_SERVER['PHP_SELF'] ?>" method="get">
                <label for="">Agregar Nuevo Tema</label>
                <input type="text" name="nombreTema" required>
                <input type="submit" name="nuevoTema" value="Guardar Tema" class="btn">
            </form>
        </div>
    </div>

    <script src="script.js"></script>
    <script>
        paginaActiva(1);
    </script>
</body>

</html>