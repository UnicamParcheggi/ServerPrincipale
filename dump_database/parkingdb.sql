-- MySQL dump 10.13  Distrib 5.7.21, for Linux (x86_64)
--
-- Host: localhost    Database: parkingdb
-- ------------------------------------------------------
-- Server version	5.7.21

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `abbonamenti`
--

DROP TABLE IF EXISTS `abbonamenti`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `abbonamenti` (
  `idAbbonamento` int(11) NOT NULL AUTO_INCREMENT,
  `idUtente` int(11) NOT NULL,
  `dataInizio` date NOT NULL,
  `dataFine` date NOT NULL,
  PRIMARY KEY (`idAbbonamento`),
  KEY `idUtente_idx` (`idUtente`),
  CONSTRAINT `UtenteAbbonato` FOREIGN KEY (`idUtente`) REFERENCES `utenti` (`idUtente`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `abbonamenti`
--

LOCK TABLES `abbonamenti` WRITE;
/*!40000 ALTER TABLE `abbonamenti` DISABLE KEYS */;
/*!40000 ALTER TABLE `abbonamenti` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary table structure for view `admin_view`
--

DROP TABLE IF EXISTS `admin_view`;
/*!50001 DROP VIEW IF EXISTS `admin_view`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `admin_view` AS SELECT 
 1 AS `idUtente`,
 1 AS `username`,
 1 AS `password`,
 1 AS `email`,
 1 AS `nome`,
 1 AS `cognome`,
 1 AS `livelloAmministrazione`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `amministratori`
--

DROP TABLE IF EXISTS `amministratori`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `amministratori` (
  `idUtenteAmministratore` int(11) NOT NULL,
  `livelloAmministrazione` tinyint(1) NOT NULL,
  PRIMARY KEY (`idUtenteAmministratore`),
  CONSTRAINT `AmministratoreAssociato` FOREIGN KEY (`idUtenteAmministratore`) REFERENCES `utenti` (`idUtente`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `amministratori`
--

LOCK TABLES `amministratori` WRITE;
/*!40000 ALTER TABLE `amministratori` DISABLE KEYS */;
INSERT INTO `amministratori` VALUES (2,7);
/*!40000 ALTER TABLE `amministratori` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary table structure for view `autisti_view`
--

DROP TABLE IF EXISTS `autisti_view`;
/*!50001 DROP VIEW IF EXISTS `autisti_view`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `autisti_view` AS SELECT 
 1 AS `idUtente`,
 1 AS `numeroCarta`,
 1 AS `dataDiScadenza`,
 1 AS `pinDiVerifica`,
 1 AS `username`,
 1 AS `password`,
 1 AS `email`,
 1 AS `nome`,
 1 AS `cognome`,
 1 AS `dataDiNascita`,
 1 AS `telefono`,
 1 AS `saldo`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `carte_di_credito`
--

DROP TABLE IF EXISTS `carte_di_credito`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `carte_di_credito` (
  `idUtente` int(11) NOT NULL,
  `numeroCarta` varchar(32) NOT NULL,
  `dataDiScadenza` date NOT NULL,
  `pinDiVerifica` varchar(8) NOT NULL,
  PRIMARY KEY (`numeroCarta`,`dataDiScadenza`,`idUtente`),
  KEY `ProprietarioCarta` (`idUtente`),
  CONSTRAINT `ProprietarioCarta` FOREIGN KEY (`idUtente`) REFERENCES `utenti` (`idUtente`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carte_di_credito`
--

LOCK TABLES `carte_di_credito` WRITE;
/*!40000 ALTER TABLE `carte_di_credito` DISABLE KEYS */;
INSERT INTO `carte_di_credito` VALUES (92,'08475034','2027-01-09','666'),(103,'0987543452','2024-10-01','7543'),(109,'2345235','2018-03-20','234'),(65,'238976253','1997-10-10','853'),(60,'34523452345','2023-01-01','809'),(101,'365948453','2022-03-23','3909'),(114,'4534536453','2025-05-01','4355'),(102,'456456465','2038-03-05','456'),(2,'89234234','1990-10-24','7999');
/*!40000 ALTER TABLE `carte_di_credito` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parcheggi`
--

DROP TABLE IF EXISTS `parcheggi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `parcheggi` (
  `idParcheggio` int(11) NOT NULL AUTO_INCREMENT,
  `coordinataX` varchar(64) NOT NULL,
  `coordinataY` varchar(64) NOT NULL,
  `citta` varchar(32) NOT NULL,
  `cap` varchar(8) NOT NULL,
  `via` varchar(64) NOT NULL,
  `numero_civico` varchar(8) NOT NULL,
  `tariffaOrariaLavorativi` double NOT NULL,
  `tariffaOrariaFestivi` double NOT NULL,
  `provincia` varchar(8) NOT NULL,
  `key` varchar(64) NOT NULL,
  PRIMARY KEY (`idParcheggio`),
  UNIQUE KEY `key_UNIQUE` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parcheggi`
--

LOCK TABLES `parcheggi` WRITE;
/*!40000 ALTER TABLE `parcheggi` DISABLE KEYS */;
INSERT INTO `parcheggi` VALUES (0,'43.136840','13.067224','Camerino','62032','Via U. Betti','13',0.8,1.2,'MC','test'),(1,'41.900944','12.515249','Roma','00185','De Lollis/irpini','6A',2,2.5,'RM','2'),(2,'43.348337','12.921714','Fabriano','60040','Viale Beniamino Gigli','21',1.2,1.7,'AN','3'),(3,'43.601634','13.507641','Ancona ','60127','Via Folli','5',2.3,3.2,'AN','4'),(4,'43.115748','12.384730','Perugia','06123','Via Alessandro Pascoli','2',1.4,1.8,'PG','5'),(5,'43.299480','13.443915','Macerata','62100','Via Gino Valentini','4',2,2.5,'MC','6'),(6,'42.854923','13.586182','Ascoli Piceno','63100','Porta Maggiore','2',1.5,2,'AP','7'),(7,'43.081999','13.042297','Muccia','62034','Via Compo della Fiera','6',1.7,1.9,'MC','8'),(8,'43.218024','13.298582','Tolentino','62029','Via Goffredo Mameli','6',1.5,2,'MC','9'),(9,'43.300690','13.734134','Civitanova Marche','62012','Via Carnia','88-2',1.7,1.9,'MC','10'),(10,'43.523618','13.237300','Jesi','60035','Piazza Donato Bramante','18',2,2.1,'AN','11'),(11,'43.917404','12.902683','Pesaro','61121','Lungofoglia Nazioni','2A',1.7,1.9,'PU','12'),(12,'42.740658','12.737360','Spoleto','06049','Piazza della Vittoria','26',2,2.1,'PG','13'),(13,'43.099701','11.789724','Montepulciano','53045','Via Iris Origo','54',1.6,1.8,'SI','14'),(14,'42.951717','12.704308','Foligno','06034','Via Nazario Sauro','1',2,2.4,'PG','15'),(22,'43.301997','13.447275','Macerata','62100','Via Due Fonti','14',1.1,1.6,'MC','16');
/*!40000 ALTER TABLE `parcheggi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `posti_parcheggio`
--

DROP TABLE IF EXISTS `posti_parcheggio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `posti_parcheggio` (
  `id_parcheggio` int(11) NOT NULL,
  `id_tipo` int(11) NOT NULL,
  `numero_posti` int(11) NOT NULL,
  PRIMARY KEY (`id_parcheggio`,`id_tipo`),
  KEY `id_tipo_posto_associato_idx` (`id_tipo`),
  KEY `parcheggioAssociato_idx` (`id_parcheggio`),
  CONSTRAINT `id_parcheggioAssociato` FOREIGN KEY (`id_parcheggio`) REFERENCES `parcheggi` (`idParcheggio`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `id_tipo_posto_associato` FOREIGN KEY (`id_tipo`) REFERENCES `tipo_parcheggio` (`idTipo_parcheggio`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posti_parcheggio`
--

LOCK TABLES `posti_parcheggio` WRITE;
/*!40000 ALTER TABLE `posti_parcheggio` DISABLE KEYS */;
INSERT INTO `posti_parcheggio` VALUES (0,0,130),(0,1,60),(0,2,80),(0,3,30),(0,4,35),(1,0,100),(1,1,80),(1,2,75),(1,3,50),(1,4,40),(2,0,50),(2,1,34),(2,2,76),(2,3,45),(2,4,40),(3,0,100),(3,1,70),(3,2,120),(3,3,30),(3,4,50),(4,0,92),(4,1,43),(4,2,100),(4,3,34),(4,4,54),(5,0,80),(5,1,80),(5,2,64),(5,3,30),(5,4,24),(6,0,70),(6,1,40),(6,2,35),(6,3,15),(6,4,12),(7,0,92),(7,1,67),(7,2,54),(7,3,34),(7,4,23),(8,0,92),(8,1,45),(8,2,34),(8,3,54),(8,4,23),(9,0,92),(9,1,45),(9,2,55),(9,3,56),(9,4,23),(10,0,80),(10,1,20),(10,2,50),(10,3,10),(10,4,20),(11,0,92),(11,1,56),(11,2,54),(11,3,34),(11,4,12),(12,0,92),(12,1,34),(12,2,23),(12,3,43),(12,4,12),(13,0,92),(13,1,23),(13,2,34),(13,3,56),(13,4,23),(14,0,70),(14,1,42),(14,2,60),(14,3,25),(14,4,20),(22,0,60),(22,1,20),(22,2,40),(22,3,15),(22,4,12);
/*!40000 ALTER TABLE `posti_parcheggio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary table structure for view `posti_parcheggio_liberi_view`
--

DROP TABLE IF EXISTS `posti_parcheggio_liberi_view`;
/*!50001 DROP VIEW IF EXISTS `posti_parcheggio_liberi_view`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `posti_parcheggio_liberi_view` AS SELECT 
 1 AS `id_parcheggio`,
 1 AS `id_tipo`,
 1 AS `postiLiberi`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `prenotazioni_in_atto`
--

DROP TABLE IF EXISTS `prenotazioni_in_atto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `prenotazioni_in_atto` (
  `id_prenotazione` int(11) NOT NULL AUTO_INCREMENT,
  `id_utente` int(11) NOT NULL,
  `id_parcheggio` int(11) NOT NULL,
  `id_tipo_posto` int(11) NOT NULL,
  `data_scadenza` datetime NOT NULL,
  `codice` varchar(128) NOT NULL,
  PRIMARY KEY (`id_prenotazione`),
  UNIQUE KEY `codice_UNIQUE` (`codice`),
  KEY `utenteCollegato_idx` (`id_utente`),
  KEY `tipoPostoCollegato_idx` (`id_tipo_posto`),
  KEY `parcheggioCollegato_idx` (`id_parcheggio`),
  CONSTRAINT `parcheggioCollegato` FOREIGN KEY (`id_parcheggio`) REFERENCES `parcheggi` (`idParcheggio`) ON UPDATE CASCADE,
  CONSTRAINT `tipoPostoCollegato` FOREIGN KEY (`id_tipo_posto`) REFERENCES `tipo_parcheggio` (`idTipo_parcheggio`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `utenteCollegato` FOREIGN KEY (`id_utente`) REFERENCES `utenti` (`idUtente`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prenotazioni_in_atto`
--

LOCK TABLES `prenotazioni_in_atto` WRITE;
/*!40000 ALTER TABLE `prenotazioni_in_atto` DISABLE KEYS */;
INSERT INTO `prenotazioni_in_atto` VALUES (8,101,10,0,'2018-04-06 15:10:16','84d2004bf28a2095230e8e14993d398d101'),(9,101,10,0,'2018-04-06 15:10:45','258be18e31c8188555c2ff05b4d542c3101');
/*!40000 ALTER TABLE `prenotazioni_in_atto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prenotazioni_pagate`
--

DROP TABLE IF EXISTS `prenotazioni_pagate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `prenotazioni_pagate` (
  `idPrenotazione` int(11) NOT NULL AUTO_INCREMENT,
  `idUtente` int(11) NOT NULL,
  `idParcheggio` int(11) NOT NULL,
  `dataPrenotazione` datetime NOT NULL,
  `minutiPermanenza` int(11) DEFAULT '-1',
  `tipoParcheggio` int(11) NOT NULL,
  `codice` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`idPrenotazione`),
  UNIQUE KEY `codice_UNIQUE` (`codice`),
  KEY `Autista_idx` (`idUtente`),
  KEY `TipoParcheggioAssociato_idx` (`tipoParcheggio`),
  KEY `parcheggioAssociato_idx` (`idParcheggio`),
  CONSTRAINT `Autista` FOREIGN KEY (`idUtente`) REFERENCES `utenti` (`idUtente`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `TipoParcheggioAssociato` FOREIGN KEY (`tipoParcheggio`) REFERENCES `tipo_parcheggio` (`idTipo_parcheggio`) ON UPDATE CASCADE,
  CONSTRAINT `parcheggioAssociato` FOREIGN KEY (`idParcheggio`) REFERENCES `parcheggi` (`idParcheggio`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prenotazioni_pagate`
--

LOCK TABLES `prenotazioni_pagate` WRITE;
/*!40000 ALTER TABLE `prenotazioni_pagate` DISABLE KEYS */;
INSERT INTO `prenotazioni_pagate` VALUES (35,101,2,'2018-04-05 22:27:15',69,0,NULL),(36,101,2,'2018-04-05 23:37:00',0,1,NULL),(37,101,2,'2018-04-06 13:09:10',1,0,NULL),(38,101,10,'2018-04-06 13:14:50',0,0,NULL),(39,101,10,'2018-04-06 13:17:18',0,0,NULL),(40,101,10,'2018-04-06 13:17:45',0,3,NULL),(41,101,8,'2018-04-06 13:19:24',0,0,NULL),(42,101,0,'2018-04-06 14:13:21',1,0,NULL),(43,101,2,'2018-04-06 14:15:16',0,0,NULL),(44,101,0,'2018-04-06 14:30:43',0,0,NULL),(45,101,0,'2018-04-06 14:31:52',0,0,NULL),(46,101,0,'2018-04-06 14:46:31',0,0,NULL);
/*!40000 ALTER TABLE `prenotazioni_pagate` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipo_parcheggio`
--

DROP TABLE IF EXISTS `tipo_parcheggio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tipo_parcheggio` (
  `idTipo_parcheggio` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(16) NOT NULL,
  PRIMARY KEY (`idTipo_parcheggio`),
  UNIQUE KEY `nome_UNIQUE` (`nome`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipo_parcheggio`
--

LOCK TABLES `tipo_parcheggio` WRITE;
/*!40000 ALTER TABLE `tipo_parcheggio` DISABLE KEYS */;
INSERT INTO `tipo_parcheggio` VALUES (0,'auto'),(3,'autobus'),(1,'camper'),(4,'disabile'),(2,'moto');
/*!40000 ALTER TABLE `tipo_parcheggio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `utenti`
--

DROP TABLE IF EXISTS `utenti`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `utenti` (
  `idUtente` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(16) NOT NULL,
  `password` varchar(256) NOT NULL,
  `email` varchar(64) NOT NULL,
  `nome` varchar(32) NOT NULL,
  `cognome` varchar(32) NOT NULL,
  `dataDiNascita` date DEFAULT NULL,
  `telefono` varchar(16) DEFAULT NULL,
  `saldo` double DEFAULT NULL,
  `abilitato` tinyint(3) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`idUtente`),
  UNIQUE KEY `username_UNIQUE` (`username`),
  UNIQUE KEY `email_UNIQUE` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=115 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `utenti`
--

LOCK TABLES `utenti` WRITE;
/*!40000 ALTER TABLE `utenti` DISABLE KEYS */;
INSERT INTO `utenti` VALUES (2,'root','dc76e9f0c0006e8f919e0c515c66dbba3982f785','root@gmail.com','Amministratore','Pazzo','1995-10-29','34234653',1000,1),(3,'34g','ergg','mario@test.it','Dario','Rossi','2017-05-09','56745764567',0,1),(4,'sewrg','34g','gino@test.it','Gino','Pino','2017-05-09','45764576',0,1),(5,'asdgf4','seaweg','marco@test.it','Marco','Test','2017-05-09','54674567',0,1),(7,'j65er5','5ej6','mozzo@test.it','Capitano','Navale','2017-05-09','779679679',0,1),(8,'e5j6e','5ej6','capitano@test.it','Zozzo','Ubriaco','2017-05-09','45764576',0,1),(9,'dh465e','5e6j','martello@test.it','Vite','Spanata','2017-05-09','67965969',0,1),(28,'erge','erger','filippo@test.it','Filippo','Hippo','2017-05-09','4563457437',0,1),(29,'e56j','e5j6j65','h3po@test.it','Norman','Randi','2017-05-09','2457475',1,1),(55,'342523','g453g','hi45ppo@test.it','Giorgio','Mastrota','2017-05-09','45364356',4,1),(56,'gs45','4g5','hip5po@test.it','Gianni','Morandi','2017-05-09','54674567',4,1),(57,'e5g3','sg5er','hip2po@test.it','Gino','Ginoso','2017-05-09','24564356',5,1),(58,'e5g45','esg5','hi1ppo@test.it','Nomi','ACaso','2017-05-09','43564356',6,1),(59,'eg5e423','e5ghew5','hi5ppo@test.it','Peppe','Peluria','2017-05-09','6574567',7,1),(60,'erg','e5he','hi4ppo@test.it','Cinese','Gassoso','2020-01-01','777777777',0,1),(62,'test','test','prova','Luca','Sambuca','1996-11-20','3278690997',1000,1),(65,'test1','test','test@gtgest.it','Testolino','Successfull','2018-03-22','3774574',14,1),(66,'albero','nero','balber@bin.com','Alfio','Ceneri','1975-02-21','4352345',60,1),(67,'peppe','posta','peppepostino@poste.it','Peppe','Postino','1784-06-03','35254325',4,1),(68,'giag','fweg','gianio@juju.it','Gigi','Tastiera','1964-09-01','23543252',0,1),(69,'asjoweg','nowenf','hude@kurl.it','Geenos','Androide','1988-02-17','435324534',0,1),(70,'onep','onep','mantello_pelato@live.it','Saitama','Pelato','1990-04-25','43523453',1,1),(81,'436224536','onep','email1@server.dominio','Gianni','Hugo','1964-09-01','64536435',0,1),(82,'etwrhw4rt','onep','email2@server.dominio','Gilberto','Drugo','1964-09-01','45364356',0,1),(83,'ewrgewrg','onep','emai3l@server.dominio','Gulag','Pollu','1964-09-01','4576456456',0,1),(84,'eweewrg','onep','emai4l@server.dominio','Genny','Ron','1964-09-01','677777',0,1),(85,'serh','onep','email5@server.dominio','Gina','Benzina','1964-09-01','56657567',0,1),(86,'rth','onep','em3ail@server.dominio','Giga','Byte','1964-09-01','456465753',0,1),(87,'juyt','onep','emai2l@server.dominio','Guga','Ruga','1964-09-01','4564256456',0,1),(88,'ted','onep','em1ail@server.dominio','Greg','Pennarello','1981-09-01','3451451345',100,1),(89,'gnj','onep','ema1il@ser4ver.dominio','Geppetto','Mastro','1964-09-01','4564365',0,1),(90,'fdgty','onep','ema9il@server.dominio','Greta','Bruna','1964-09-10','223456645',0,1),(91,'bordi','bordi','bordi','ciccio','bordi','1996-10-10','322254',0,1),(92,'stach','18c66b36973dab974b2e422b529aab29e59f84ee','lorenzo.stacchio@studenti.unicam.it','Lorenzo','Stacchietti','1996-11-09','6666666',100,1),(94,'test2','109f4b3c50d7b0df729d299bc6f8e9ef9066971f','test@test.test','Testolaccia','Testata','2008-03-21','4564567456',0,1),(101,'empo','422068876de3222d7e1f569cae5583204fa79cc6','ruggeri85n@gmail.com','Nicolò','Ruggeri','1995-10-24','3345968526',NULL,1),(102,'Libro','18c66b36973dab974b2e422b529aab29e59f84ee','libbrone@one.it','Libro','Importante','2018-03-05','456456',0,1),(103,'Drago','e42fce0d4849d8fb9c28a71c993d36d3abb91f78','dragone@ciccione.it','Drago','Matto','2018-03-23','435345345',100,1),(104,'ergnergon','2d1a91a7239c50bb2eed020e3dc9eeb13c9240ca','giggio@gmail.com','23423','435345','2018-03-27','456t456',0,0),(105,'roberto','49089b61d0b15f16834bb4cf3a5fa45b7dfe1a74','robbyrobboso@gmail.com','Roberto','Robboso','2018-03-12','456456456',0,0),(109,'Nicolò','68b5193fd0f5308baac9d9eed453a89e6925bcf9','nicolo.ruggeri@studenti.unicam.it','Nicolò','Ruggeri','2018-03-21','435435',0,1),(110,'username','5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8','ruggeri5n@gmail.com','Nicolò','Ruggeri','2018-03-22','3345968526',0,1),(111,'rocco','88a9d5a83b2b7e4bc74200cc205858df88a90f44','ruggeri95n@gmail.com','Dubai','Genova','2018-03-17','4563463656',0,1),(112,'Testa','a94a8fe5ccb19ba61c4c0873d391e987982fbbd3','gigi@g.i','testsette','Ratti','1196-01-01','464684843',0,1),(113,'bullone','34718edb825480e8d91a0c4b6d580b1e3f35b4d9','rattolino@rat.it','BulloOne','bine','1985-03-01','664646818',NULL,1),(114,'pippo','b3919b5714626e0a12a511c0e4702fe759333c87','testgiacomo@gmail.com','Giacomo','Test','1995-10-10','03595564646',NULL,1);
/*!40000 ALTER TABLE `utenti` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `verifica_email`
--

DROP TABLE IF EXISTS `verifica_email`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `verifica_email` (
  `id_utente` int(11) NOT NULL,
  `codice` varchar(128) NOT NULL,
  PRIMARY KEY (`id_utente`),
  CONSTRAINT `utenteAssociato` FOREIGN KEY (`id_utente`) REFERENCES `utenti` (`idUtente`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `verifica_email`
--

LOCK TABLES `verifica_email` WRITE;
/*!40000 ALTER TABLE `verifica_email` DISABLE KEYS */;
INSERT INTO `verifica_email` VALUES (112,'b73dfe25b4b8714c029b37a6ad3006fa'),(113,'e07413354875be01a996dc560274708e'),(114,'89f0fd5c927d466d6ec9a21b9ac34ffa');
/*!40000 ALTER TABLE `verifica_email` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Final view structure for view `admin_view`
--

/*!50001 DROP VIEW IF EXISTS `admin_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `admin_view` AS select `utenti`.`idUtente` AS `idUtente`,`utenti`.`username` AS `username`,`utenti`.`password` AS `password`,`utenti`.`email` AS `email`,`utenti`.`nome` AS `nome`,`utenti`.`cognome` AS `cognome`,`amministratori`.`livelloAmministrazione` AS `livelloAmministrazione` from (`utenti` join `amministratori`) where (`utenti`.`idUtente` = `amministratori`.`idUtenteAmministratore`) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `autisti_view`
--

/*!50001 DROP VIEW IF EXISTS `autisti_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `autisti_view` AS select `utenti`.`idUtente` AS `idUtente`,`carte_di_credito`.`numeroCarta` AS `numeroCarta`,date_format(`carte_di_credito`.`dataDiScadenza`,'%Y-%m-%d') AS `dataDiScadenza`,`carte_di_credito`.`pinDiVerifica` AS `pinDiVerifica`,`utenti`.`username` AS `username`,`utenti`.`password` AS `password`,`utenti`.`email` AS `email`,`utenti`.`nome` AS `nome`,`utenti`.`cognome` AS `cognome`,date_format(`utenti`.`dataDiNascita`,'%Y-%m-%d') AS `dataDiNascita`,`utenti`.`telefono` AS `telefono`,`utenti`.`saldo` AS `saldo` from (`utenti` left join `carte_di_credito` on((`utenti`.`idUtente` = `carte_di_credito`.`idUtente`))) where (`utenti`.`abilitato` = 1) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `posti_parcheggio_liberi_view`
--

/*!50001 DROP VIEW IF EXISTS `posti_parcheggio_liberi_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `posti_parcheggio_liberi_view` AS select `pt1`.`idparcheggio` AS `id_parcheggio`,`pt1`.`tposti` AS `id_tipo`,(`pt1`.`liberi1` - ifnull(`o2`.`occupati2`,0)) AS `postiLiberi` from (((select `parkingdb`.`posti_parcheggio`.`id_parcheggio` AS `idparcheggio`,`parkingdb`.`posti_parcheggio`.`id_tipo` AS `tposti`,(`parkingdb`.`posti_parcheggio`.`numero_posti` - ifnull(`o1`.`occupati1`,0)) AS `liberi1` from (`parkingdb`.`posti_parcheggio` left join (select `parkingdb`.`prenotazioni_in_atto`.`id_parcheggio` AS `id_parcheggio`,`parkingdb`.`prenotazioni_in_atto`.`id_tipo_posto` AS `id_tipo_posto`,count(0) AS `occupati1` from `parkingdb`.`prenotazioni_in_atto` group by `parkingdb`.`prenotazioni_in_atto`.`id_parcheggio`,`parkingdb`.`prenotazioni_in_atto`.`id_tipo_posto`) `o1` on(((`parkingdb`.`posti_parcheggio`.`id_parcheggio` = `o1`.`id_parcheggio`) and (`parkingdb`.`posti_parcheggio`.`id_tipo` = `o1`.`id_tipo_posto`)))))) `pt1` left join (select `parkingdb`.`prenotazioni_pagate`.`idParcheggio` AS `idParcheggio`,`parkingdb`.`prenotazioni_pagate`.`tipoParcheggio` AS `tipoParcheggio`,count(0) AS `occupati2` from `parkingdb`.`prenotazioni_pagate` where (`parkingdb`.`prenotazioni_pagate`.`minutiPermanenza` < 0) group by `parkingdb`.`prenotazioni_pagate`.`idParcheggio`,`parkingdb`.`prenotazioni_pagate`.`tipoParcheggio`) `o2` on(((`pt1`.`idparcheggio` = `o2`.`idParcheggio`) and (`pt1`.`tposti` = `o2`.`tipoParcheggio`)))) order by `pt1`.`idparcheggio`,`pt1`.`tposti` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-04-06 14:51:42
